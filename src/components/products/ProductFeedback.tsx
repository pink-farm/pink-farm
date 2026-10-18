"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle, Send, ShieldCheck, Star, ThumbsUp, X, Sparkles, PenLine, Filter, Heart } from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";

type FeedbackEntry = {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  rating?: number;
  isVerified?: boolean;
};

type FeedbackKind = "review" | "comment";
type OwnReview = { id: string; rating: number; content: string } | null;

const QUICK_TAGS = [
  "Super crunchy & fresh",
  "Zero palm oil taste",
  "Flavor is 10/10",
  "Perfect tea-time snack",
  "High quality lotus seeds",
  "Loved the airtight jar",
  "Healthy guilt-free snacking",
];

const RATING_LABELS: Record<number, string> = {
  5: "Loved it! Crunchy, delicious & top quality ⭐⭐⭐⭐⭐",
  4: "Very Good! Enjoyed the flavour & crispness ⭐⭐⭐⭐",
  3: "Good — decent healthy snack ⭐⭐⭐",
  2: "Fair — could be improved ⭐⭐",
  1: "Poor — did not meet expectations ⭐",
};

export function ProductFeedback({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const isLoggedIn = useCustomerStore((state) => state.isLoggedIn);
  const customerName = useCustomerStore((state) => state.profile?.name || "");
  const customerEmail = useCustomerStore((state) => state.profile?.email || "");

  const [reviews, setReviews] = useState<FeedbackEntry[]>([]);
  const [comments, setComments] = useState<FeedbackEntry[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<{ rating: number; count: number }[]>([]);
  const [myReview, setMyReview] = useState<OwnReview>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review form state
  const [activeForm, setActiveForm] = useState<FeedbackKind | null>(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [error, setError] = useState("");
  const [feedbackLoadError, setFeedbackLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedbackKind>("review");

  // Filter & sort
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");
  
  // Helpful votes tracked locally
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});

  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const loadFeedback = async () => {
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(slug)}/feedback`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Feedback is temporarily unavailable.");
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setAverageRating(Number(data.averageRating) || 0);
      setReviewCount(Number(data.reviewCount) || 0);
      setRatingDistribution(Array.isArray(data.ratingDistribution) ? data.ratingDistribution : []);
      setMyReview(data.myReview || null);
      setHasPurchased(Boolean(data.hasPurchased));
      setFeedbackLoadError("");
    } catch (loadError) {
      setFeedbackLoadError(loadError instanceof Error ? loadError.message : "Feedback is temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/products/${encodeURIComponent(slug)}/feedback`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Feedback is temporarily unavailable.");
        if (!active) return;
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setAverageRating(Number(data.averageRating) || 0);
        setReviewCount(Number(data.reviewCount) || 0);
        setRatingDistribution(Array.isArray(data.ratingDistribution) ? data.ratingDistribution : []);
        setMyReview(data.myReview || null);
        setHasPurchased(Boolean(data.hasPurchased));
        setFeedbackLoadError("");
      })
      .catch((loadError: unknown) => {
        if (active) setFeedbackLoadError(loadError instanceof Error ? loadError.message : "Feedback is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  // Check URL query param `?review=1`
  useEffect(() => {
    if (searchParams && searchParams.get("review") === "1") {
      setActiveForm("review");
      if (myReview) {
        setRating(myReview.rating);
        setContent(myReview.content);
      }
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams, myReview]);

  const startForm = (kind: FeedbackKind) => {
    setError("");
    setNotice("");
    setActiveTab(kind);
    setActiveForm(kind);
    if (kind === "review") {
      setRating(myReview?.rating ?? 5);
      setContent(myReview?.content ?? "");
    } else {
      setContent("");
    }
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const addTagToContent = (tag: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return tag;
      if (trimmed.includes(tag)) return prev;
      return `${trimmed}. ${tag}`;
    });
  };

  const handleHelpfulClick = (id: string) => {
    if (votedReviews[id]) return;
    setHelpfulVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setVotedReviews((prev) => ({ ...prev, [id]: true }));
  };

  const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        kind: activeForm,
        content: content.trim(),
        ...(activeForm === "review" ? { rating } : {}),
      };

      if (!isLoggedIn) {
        if (!guestName.trim() || !guestEmail.trim()) {
          setError("Please provide your name and email to submit your review.");
          setIsSaving(false);
          return;
        }
        payload.authorName = guestName.trim();
        payload.authorEmail = guestEmail.trim().toLowerCase();
      }

      const response = await fetch(`/api/products/${encodeURIComponent(slug)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.status === 401 || data.code === "ACCOUNT_REQUIRED") {
        setShowAccountPrompt(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || "We couldn’t save your feedback.");

      if (activeForm === "review") {
        setReviews((current) => [data.review, ...current.filter((r) => r.id !== data.review.id)]);
        setNotice("Thank you! Your verified review is now live.");
      } else {
        setComments((current) => [data.comment, ...current]);
        setNotice("Your comment has been posted.");
      }
      setActiveForm(null);
      setContent("");
      await loadFeedback();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t save your feedback.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and sort reviews
  const displayedReviews = useMemo(() => {
    let result = [...reviews];
    if (selectedStarFilter !== null) {
      result = result.filter((r) => r.rating === selectedStarFilter);
    }
    if (sortBy === "highest") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "lowest") {
      result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [reviews, selectedStarFilter, sortBy]);

  return (
    <>
      <section
        id="reviews"
        ref={sectionRef}
        aria-labelledby="feedback-heading"
        className="scroll-mt-24 overflow-hidden rounded-[2.5rem] border border-brand-green/12 bg-white shadow-[0_20px_70px_rgba(26,64,49,0.06)]"
      >
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-green via-[#1f4e3c] to-[#122e25] px-6 py-8 text-white sm:px-10 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full bg-brand-champagne/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-brand-pink/15 blur-2xl"
          />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-champagne backdrop-blur-md border border-white/10">
                <ShieldCheck size={14} className="text-brand-champagne" /> 100% Verified Customer Reviews
              </span>
              <h2 id="feedback-heading" className="font-serif text-3xl font-semibold sm:text-4xl">
                Ratings & Customer Reviews
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Real feedback from snack lovers across India who purchased and enjoyed this product.
              </p>
            </div>

            {/* Shopping App Score Badge */}
            <div className="flex items-center gap-4 rounded-3xl border border-white/20 bg-white/12 px-5 py-4 backdrop-blur-md shadow-lg shadow-black/10">
              <div className="flex flex-col items-center border-r border-white/20 pr-4">
                <span className="text-4xl font-extrabold tracking-tight tabular-nums text-white">
                  {feedbackLoadError ? "—" : reviewCount > 0 ? averageRating.toFixed(1) : "—"}
                </span>
                <span className="text-[11px] font-medium text-white/70">
                  {reviewCount > 0 ? "out of 5" : "No ratings"}
                </span>
              </div>
              <div>
                <div
                  className="flex gap-1 text-amber-400"
                  aria-label={reviewCount ? `${averageRating.toFixed(1)} out of 5 stars` : "No ratings yet"}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        reviewCount > 0 && star <= Math.round(averageRating)
                          ? "fill-current"
                          : "text-white/30"
                      }
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold text-white/85">
                  {feedbackLoadError
                    ? "Temporarily unavailable"
                    : reviewCount > 0
                    ? `${reviewCount} ${reviewCount === 1 ? "Verified Rating" : "Verified Ratings"}`
                    : "No reviews yet"}
                </p>
                <p className="text-[10px] text-brand-champagne font-medium">
                  {reviewCount > 0 ? "✓ 100% Genuine Purchases" : "Be the first to rate & review"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Purchased Alert Banner */}
        {hasPurchased && (
          <div className="border-b border-emerald-100 bg-emerald-50/80 px-6 py-3.5 sm:px-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-emerald-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold shrink-0">
                ✓
              </span>
              <span>
                <strong>You purchased this product!</strong> How did you like the taste and crunch?
              </span>
            </div>
            <button
              type="button"
              onClick={() => startForm("review")}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
            >
              <Star size={13} className="fill-current" /> {myReview ? "Edit Your Review" : "Rate & Review Now"}
            </button>
          </div>
        )}

        {/* Main Body Grid */}
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] xl:grid-cols-[0.75fr_1.25fr]">
          {/* Left Column: Summary breakdown & Write Review button */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-brand-green/10 bg-brand-cream/40 p-6">
              <h3 className="font-serif text-lg font-bold text-brand-green mb-1">Customer Rating Breakdown</h3>
              <p className="text-xs text-brand-charcoal/60 mb-5">Click any star tier below to filter reviews</p>

              {/* Star Distribution Bars */}
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map((val) => {
                  const match = ratingDistribution.find((d) => d.rating === val);
                  const count = match ? match.count : 0;
                  const total = reviewCount || 1;
                  const percent = reviewCount > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
                  const isSelected = selectedStarFilter === val;

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedStarFilter(isSelected ? null : val)}
                      className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs transition-all ${
                        isSelected
                          ? "bg-amber-100/70 font-bold text-brand-green ring-1 ring-amber-300"
                          : "text-brand-charcoal/70 hover:bg-brand-cream hover:text-brand-green"
                      }`}
                      title={`Filter by ${val} star reviews`}
                    >
                      <span className="flex w-12 shrink-0 items-center gap-1 font-semibold">
                        <span>{val}</span>
                        <Star size={12} className="fill-amber-400 text-amber-500" />
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-green/10">
                        <div
                          className="h-full rounded-full bg-amber-400 group-hover:bg-amber-500 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right tabular-nums text-[11px] font-semibold text-brand-charcoal/60">
                        {percent}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedStarFilter !== null && (
                <div className="mt-4 flex items-center justify-between border-t border-brand-green/10 pt-3 text-xs">
                  <span className="text-brand-green font-semibold">
                    Showing {selectedStarFilter}★ reviews only
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedStarFilter(null)}
                    className="text-amber-800 hover:underline font-bold"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>

            {/* Shopping App Highlights Badges */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl border border-brand-green/8 bg-brand-cream/30 p-3 text-center">
                <span className="text-lg">🌿</span>
                <p className="mt-1 text-xs font-bold text-brand-green">Roasted, Not Fried</p>
                <p className="text-[10px] text-brand-charcoal/60">Zero palm oil</p>
              </div>
              <div className="rounded-2xl border border-brand-green/8 bg-brand-cream/30 p-3 text-center">
                <span className="text-lg">⚡</span>
                <p className="mt-1 text-xs font-bold text-brand-green">Super Crunchy</p>
                <p className="text-[10px] text-brand-charcoal/60">Airtight sealed</p>
              </div>
            </div>

            {/* Write a Review Card */}
            <div className="rounded-3xl border border-brand-green/12 bg-white p-6 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-brand-green">Review this product</h3>
              <p className="mt-1 text-xs leading-5 text-brand-charcoal/65">
                Share your thoughts with other customers. Tell us what you loved about the crunch, taste, or packaging!
              </p>

              <button
                type="button"
                onClick={() => startForm("review")}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-green to-[#27614d] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-green/20 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              >
                <Star size={16} className="fill-amber-400 text-amber-400 transition-transform group-hover:scale-110" />
                <span>{myReview ? "Update Your Review" : "Write a Customer Review"}</span>
              </button>

              <button
                type="button"
                onClick={() => startForm("comment")}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-green/15 bg-brand-cream/40 px-5 py-2.5 text-xs font-bold text-brand-green transition-colors hover:bg-brand-cream"
              >
                <MessageCircle size={15} />
                <span>Ask a question or comment</span>
              </button>
            </div>
          </aside>

          {/* Right Column: Review Form & Review List */}
          <div className="min-w-0">
            {/* Tab switch (Reviews vs Comments) */}
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-brand-green/10 pb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab("review"); setSelectedStarFilter(null); }}
                  className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    activeTab === "review"
                      ? "bg-brand-green text-white shadow-sm"
                      : "bg-brand-cream/60 text-brand-charcoal/70 hover:text-brand-green"
                  }`}
                >
                  Customer Reviews ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("comment"); setSelectedStarFilter(null); }}
                  className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    activeTab === "comment"
                      ? "bg-brand-green text-white shadow-sm"
                      : "bg-brand-cream/60 text-brand-charcoal/70 hover:text-brand-green"
                  }`}
                >
                  Q&A / Comments ({comments.length})
                </button>
              </div>

              {activeTab === "review" && (
                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-brand-charcoal/40" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "recent" | "highest" | "lowest")}
                    className="rounded-lg border border-brand-green/15 bg-white px-2.5 py-1 text-xs font-medium text-brand-charcoal outline-none focus:border-brand-green"
                    aria-label="Sort reviews"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              )}
            </div>

            {/* Interactive Review Form */}
            <AnimatePresence initial={false} mode="wait">
              {activeForm && (
                <motion.form
                  ref={formRef}
                  key={activeForm}
                  onSubmit={submitFeedback}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="mb-8 overflow-hidden rounded-3xl border-2 border-brand-green/20 bg-gradient-to-br from-white via-white to-brand-cream/30 p-5 sm:p-7 shadow-xl shadow-brand-green/5"
                >
                  <div className="flex items-center justify-between border-b border-brand-green/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-white">
                        <PenLine size={15} />
                      </span>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-brand-green">
                          {activeForm === "review"
                            ? myReview
                              ? "Edit your review"
                              : "Write your review"
                            : "Ask a question / comment"}
                        </h3>
                        <p className="text-[11px] text-brand-charcoal/60">
                          {activeForm === "review"
                            ? "Help fellow shoppers choose the right snack"
                            : "Ask about ingredients, storage, or shelf-life"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveForm(null)}
                      aria-label="Close form"
                      className="rounded-full p-2 text-brand-charcoal/40 transition hover:bg-brand-cream hover:text-brand-green"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Interactive Star Picker */}
                    {activeForm === "review" && (
                      <div>
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70">
                          Overall Rating <span className="text-rose-500">*</span>
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <div
                            className="flex gap-1"
                            role="radiogroup"
                            aria-label="Product rating"
                            onMouseLeave={() => setHoverRating(null)}
                          >
                            {[1, 2, 3, 4, 5].map((value) => {
                              const activeStar = hoverRating !== null ? value <= hoverRating : value <= rating;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  role="radio"
                                  aria-checked={rating === value}
                                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                                  onMouseEnter={() => setHoverRating(value)}
                                  onClick={() => setRating(value)}
                                  className="rounded-lg p-1 text-amber-400 transition-transform hover:scale-120 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                >
                                  <Star
                                    size={32}
                                    className={activeStar ? "fill-amber-400 text-amber-500 drop-shadow-xs" : "text-amber-200"}
                                  />
                                </button>
                              );
                            })}
                          </div>
                          <span className="text-xs font-semibold text-brand-green">
                            {RATING_LABELS[hoverRating ?? rating]}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick review tags */}
                    {activeForm === "review" && (
                      <div>
                        <span className="mb-1.5 block text-[11px] font-semibold text-brand-charcoal/60">
                          Click to add quick feedback:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_TAGS.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTagToContent(tag)}
                              className="rounded-full border border-brand-green/15 bg-white px-3 py-1 text-[11px] font-medium text-brand-green transition hover:border-brand-green hover:bg-brand-cream"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review text */}
                    <div>
                      <label className="block">
                        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70">
                          {activeForm === "review" ? "Detailed Review" : "Your Message"}{" "}
                          <span className="text-rose-500">*</span>
                        </span>
                        <textarea
                          required
                          minLength={2}
                          maxLength={1200}
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={
                            activeForm === "review"
                              ? "What did you think about the crunch, freshness, and flavor? How does it compare to other snacks?"
                              : "Ask your question or share a serving suggestion…"
                          }
                          rows={4}
                          className="w-full resize-y rounded-2xl border border-brand-green/20 bg-white p-4 text-sm leading-6 text-brand-charcoal outline-none transition focus:border-brand-green focus:ring-4 focus:ring-brand-green/5"
                        />
                        <span className="mt-1 block text-right text-[11px] text-brand-charcoal/40">
                          {content.length}/1,200 characters
                        </span>
                      </label>
                    </div>

                    {/* Guest input if not logged in */}
                    {!isLoggedIn ? (
                      <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-brand-green/10 bg-brand-cream/30 p-4">
                        <div>
                          <label className="block text-xs font-bold text-brand-charcoal/70 mb-1">
                            Your Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="e.g. Rahul Sharma"
                            className="w-full rounded-xl border border-brand-green/15 bg-white px-3.5 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-green"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-brand-charcoal/70 mb-1">
                            Your Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            placeholder="e.g. rahul@gmail.com"
                            className="w-full rounded-xl border border-brand-green/15 bg-white px-3.5 py-2 text-sm text-brand-charcoal outline-none focus:border-brand-green"
                          />
                          <span className="text-[10px] text-brand-charcoal/50 mt-0.5 block">
                            Private — won’t be displayed publicly
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl bg-brand-green/5 px-3.5 py-2 text-xs text-brand-green">
                        <ShieldCheck size={14} className="text-emerald-700" />
                        <span>
                          Posting as <strong>{customerName || "Pink Farm Member"}</strong> ({customerEmail})
                        </span>
                      </div>
                    )}

                    {error && (
                      <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                        {error}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveForm(null)}
                        className="rounded-xl px-4 py-2.5 text-xs font-bold text-brand-charcoal/60 hover:bg-brand-cream transition"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving || content.trim().length < 2 || (activeForm === "review" && rating === 0)}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-green/20 transition-all hover:-translate-y-0.5 hover:bg-brand-green-light disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? "Publishing…" : activeForm === "review" ? (myReview ? "Update Review" : "Publish Review") : "Post Comment"}
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {notice && (
              <p
                role="status"
                className="mb-5 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-sm font-semibold text-emerald-800"
              >
                <Check size={18} className="text-emerald-600 shrink-0" />
                {notice}
              </p>
            )}

            {/* List of Reviews or Comments */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-3" aria-label="Loading customer reviews">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-32 animate-pulse rounded-2xl bg-brand-cream/60" />
                  ))}
                </div>
              ) : activeTab === "review" ? (
                displayedReviews.length ? (
                  displayedReviews.map((entry) => (
                    <motion.article
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-brand-green/10 bg-white p-5 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink via-brand-champagne/70 to-brand-green/20 text-sm font-bold text-brand-green shadow-xs">
                            {entry.author.trim().charAt(0).toUpperCase() || "P"}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-brand-charcoal">
                                {entry.author}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                <ShieldCheck size={11} className="text-emerald-600" /> Verified Buyer
                              </span>
                            </div>
                            <time
                              dateTime={entry.createdAt}
                              className="text-[11px] text-brand-charcoal/50"
                            >
                              Reviewed in India on{" "}
                              {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          </div>
                        </div>

                        {/* Stars */}
                        {entry.rating && (
                          <div
                            className="flex shrink-0 gap-0.5 text-amber-400"
                            aria-label={`${entry.rating} out of 5 stars`}
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={15}
                                className={
                                  star <= entry.rating! ? "fill-current" : "text-amber-200"
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <p className="mt-3.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-brand-charcoal/85">
                        {entry.content}
                      </p>

                      {/* Helpful Button footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-brand-green/6 pt-3 text-xs text-brand-charcoal/50">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleHelpfulClick(entry.id)}
                            disabled={votedReviews[entry.id]}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition ${
                              votedReviews[entry.id]
                                ? "bg-emerald-50 text-emerald-700 font-bold"
                                : "hover:bg-brand-cream hover:text-brand-green"
                            }`}
                          >
                            <ThumbsUp size={12} className={votedReviews[entry.id] ? "fill-emerald-600" : ""} />
                            <span>
                              {votedReviews[entry.id]
                                ? "Helpful (Thank you!)"
                                : `Helpful (${helpfulVotes[entry.id] || 0})`}
                            </span>
                          </button>
                        </div>
                        <span className="text-[10px] text-brand-charcoal/40">Verified Purchase</span>
                      </div>
                    </motion.article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-brand-green/20 bg-brand-cream/30 p-8 text-center">
                    <Star size={24} className="mx-auto text-amber-400 mb-2" />
                    <h4 className="font-serif font-bold text-brand-green">
                      {selectedStarFilter !== null ? "No reviews matching this filter" : "No customer reviews yet"}
                    </h4>
                    <p className="text-xs text-brand-charcoal/60 mt-1">
                      {selectedStarFilter !== null
                        ? "Try selecting a different star rating."
                        : "Be the first to share your experience with this product!"}
                    </p>
                    {selectedStarFilter !== null ? (
                      <button
                        type="button"
                        onClick={() => setSelectedStarFilter(null)}
                        className="mt-3 text-xs font-bold text-brand-green underline"
                      >
                        View all reviews
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startForm("review")}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-green-light transition"
                      >
                        <Star size={13} className="fill-current" /> Write the First Review
                      </button>
                    )}
                  </div>
                )
              ) : comments.length ? (
                comments.map((entry) => (
                  <motion.article
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-brand-green/10 bg-white p-5 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-sm font-bold text-brand-green">
                        {entry.author.trim().charAt(0).toUpperCase() || "P"}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-brand-charcoal">{entry.author}</span>
                        <time
                          dateTime={entry.createdAt}
                          className="block text-[11px] text-brand-charcoal/50"
                        >
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-brand-charcoal/85">{entry.content}</p>
                  </motion.article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-brand-green/20 bg-brand-cream/30 p-8 text-center">
                  <MessageCircle size={24} className="mx-auto text-brand-green/60 mb-2" />
                  <h4 className="font-serif font-bold text-brand-green">No questions yet</h4>
                  <p className="text-xs text-brand-charcoal/60 mt-1">Have a question about ingredients or storage? Ask away!</p>
                  <button
                    type="button"
                    onClick={() => startForm("comment")}
                    className="mt-3 text-xs font-bold text-brand-green underline"
                  >
                    Ask the first question
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Account prompt modal */}
      <AnimatePresence>
        {showAccountPrompt && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#10271f]/65 p-4 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setShowAccountPrompt(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 26, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.97 }}
              className="relative my-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-brand-ivory p-7 shadow-2xl sm:p-9"
            >
              <button
                type="button"
                onClick={() => setShowAccountPrompt(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-brand-charcoal/45 hover:bg-brand-green/5 hover:text-brand-green"
              >
                <X size={18} />
              </button>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-[#37785a] text-white shadow-lg shadow-brand-green/20">
                <ShieldCheck size={29} />
              </div>
              <h2 className="text-center font-serif text-2xl font-semibold text-brand-green">
                Sign in to share your review
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-brand-charcoal/65">
                Signing in keeps community reviews 100% authentic and verified.
              </p>
              <div className="mt-6 grid gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/products/${slug}?review=1#reviews`)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-green-light"
                >
                  Sign in to your account →
                </Link>
                <Link
                  href={`/login?register=1&redirect=${encodeURIComponent(`/products/${slug}?review=1#reviews`)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green/15 bg-white px-5 py-3 text-sm font-bold text-brand-green hover:bg-brand-cream"
                >
                  Create a new account
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
