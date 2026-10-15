"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle, Send, ShieldCheck, Star, X } from "lucide-react";
import { useCustomerStore } from "@/store/customerStore";

type FeedbackEntry = {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  rating?: number;
};

type FeedbackKind = "review" | "comment";
type OwnReview = { id: string; rating: number; content: string } | null;

export function ProductFeedback({ slug }: { slug: string }) {
  const isLoggedIn = useCustomerStore((state) => state.isLoggedIn);
  const [reviews, setReviews] = useState<FeedbackEntry[]>([]);
  const [comments, setComments] = useState<FeedbackEntry[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<{ rating: number; count: number }[]>([]);
  const [myReview, setMyReview] = useState<OwnReview>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<FeedbackKind | null>(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [feedbackLoadError, setFeedbackLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<FeedbackKind>("review");

  const productPath = `/products/${encodeURIComponent(slug)}#reviews`;
  const visibleEntries = activeTab === "review" ? reviews : comments;
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
        setFeedbackLoadError("");
      })
      .catch((loadError: unknown) => {
        if (active) setFeedbackLoadError(loadError instanceof Error ? loadError.message : "Feedback is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
    // This effect refreshes only when navigating to another product.
  }, [slug]);

  const startForm = (kind: FeedbackKind) => {
    setError("");
    setNotice("");
    if (!isLoggedIn) {
      setShowAccountPrompt(true);
      return;
    }
    setActiveTab(kind);
    setActiveForm(kind);
    setRating(kind === "review" ? myReview?.rating ?? 0 : 0);
    setContent(kind === "review" ? myReview?.content ?? "" : "");
  };

  const submitFeedback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(slug)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: activeForm, content, ...(activeForm === "review" ? { rating } : {}) }),
      });
      const data = await response.json();
      if (response.status === 401 || data.code === "ACCOUNT_REQUIRED") {
        setActiveForm(null);
        setShowAccountPrompt(true);
        return;
      }
      if (!response.ok) throw new Error(data.error || "We couldn’t save your feedback.");

      if (activeForm === "review") {
        setReviews((current) => [data.review, ...current.filter((review) => review.id !== data.review.id)]);
        setNotice("Your review is live. Thank you for sharing your experience!");
      } else {
        setComments((current) => [data.comment, ...current]);
        setNotice("Your comment has been posted. Thanks for joining the conversation!");
      }
      setActiveForm(null);
      setContent("");
      setRating(0);
      await loadFeedback();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We couldn’t save your feedback.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section id="reviews" aria-labelledby="feedback-heading" className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-brand-green/10 bg-white shadow-[0_20px_70px_rgba(26,64,49,0.08)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-green via-[#245744] to-[#173a30] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-brand-champagne/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-champagne"><ShieldCheck size={15} /> From the Pink Farm community</p>
              <h2 id="feedback-heading" className="font-serif text-3xl font-semibold sm:text-4xl">Real notes. Real goodness.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">Reviews and conversations shared by Pink Farm account holders.</p>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="text-3xl font-bold tabular-nums">{feedbackLoadError ? "—" : reviewCount ? averageRating.toFixed(1) : "—"}</div>
              <div>
                <div className="flex gap-0.5 text-brand-champagne" aria-label={reviewCount ? `${averageRating.toFixed(1)} out of 5 stars` : "No ratings yet"}>
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} className={reviewCount && star <= Math.round(averageRating) ? "fill-current" : "text-white/40"} />)}
                </div>
                <p className="mt-1 text-xs text-white/70">{feedbackLoadError ? "Temporarily unavailable" : `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-5">
            <div>
              <h3 className="font-serif text-xl font-semibold text-brand-green">Your experience matters</h3>
              <p className="mt-1 text-sm leading-6 text-brand-charcoal/60">Tell other shoppers what you enjoyed, or ask the community a question.</p>
            </div>
            <button type="button" onClick={() => startForm("review")} className="group flex w-full items-center gap-3 rounded-2xl border border-brand-green/10 bg-brand-cream/55 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-green/25 hover:bg-brand-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm transition-transform group-hover:scale-105"><Star size={20} className="fill-current" /></span>
              <span><span className="block font-bold text-brand-green">Write a review</span><span className="mt-0.5 block text-xs text-brand-charcoal/55">Rate it from 1 to 5 stars</span></span>
            </button>
            <button type="button" onClick={() => startForm("comment")} className="group flex w-full items-center gap-3 rounded-2xl border border-brand-green/10 bg-brand-cream/55 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-green/25 hover:bg-brand-cream hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-green shadow-sm transition-transform group-hover:scale-105"><MessageCircle size={19} /></span>
              <span><span className="block font-bold text-brand-green">Add a comment</span><span className="mt-0.5 block text-xs text-brand-charcoal/55">Join the product conversation</span></span>
            </button>
            <p className="flex items-start gap-2 text-xs leading-5 text-brand-charcoal/50"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-brand-green/70" /> An active Pink Farm customer account is required. One review per account for each product; you can update yours any time.</p>
          </aside>

          <div className="min-w-0">
            {reviewCount > 0 && (
              <div className="mb-5 space-y-2 rounded-2xl border border-brand-green/8 bg-brand-cream/35 p-4">
                {ratingDistribution.map(({ rating: value, count }) => (
                  <div key={value} className="flex items-center gap-2 text-xs text-brand-charcoal/60">
                    <span className="w-8">{value} star</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-green/10"><div className="h-full rounded-full bg-amber-400 transition-[width] duration-500" style={{ width: `${reviewCount ? (count / reviewCount) * 100 : 0}%` }} /></div><span className="w-6 text-right tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4 flex gap-1 rounded-xl bg-brand-cream/70 p-1">
              <button type="button" onClick={() => setActiveTab("review")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${activeTab === "review" ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/55 hover:text-brand-green"}`}>Reviews <span className="ml-1 text-xs opacity-60">{feedbackLoadError ? "—" : reviewCount}</span></button>
              <button type="button" onClick={() => setActiveTab("comment")} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${activeTab === "comment" ? "bg-white text-brand-green shadow-sm" : "text-brand-charcoal/55 hover:text-brand-green"}`}>Comments <span className="ml-1 text-xs opacity-60">{feedbackLoadError ? "—" : comments.length}</span></button>
            </div>

            <AnimatePresence initial={false} mode="wait">
              {activeForm && (
                <motion.form key={activeForm} onSubmit={submitFeedback} initial={{ opacity: 0, y: 12, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="mb-5 space-y-4 rounded-2xl border border-brand-green/15 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-lg font-semibold text-brand-green">{activeForm === "review" ? myReview ? "Update your review" : "How was it?" : "Add to the conversation"}</h3>
                    <button type="button" onClick={() => setActiveForm(null)} aria-label="Close feedback form" className="rounded-full p-2 text-brand-charcoal/45 transition-colors hover:bg-brand-cream hover:text-brand-green"><X size={17} /></button>
                  </div>
                  {activeForm === "review" && <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-charcoal/65">Your rating</legend><div className="flex gap-1" role="radiogroup" aria-label="Product rating">
                    {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} ${value === 1 ? "star" : "stars"}`} onClick={() => setRating(value)} className="rounded-md p-1 text-amber-400 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"><Star size={27} className={value <= rating ? "fill-current" : "text-amber-300/45"} /></button>)}
                  </div></fieldset>}
                  <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-charcoal/65">{activeForm === "review" ? "Your review" : "Your comment"}</span><textarea required minLength={2} maxLength={1200} value={content} onChange={(event) => setContent(event.target.value)} placeholder={activeForm === "review" ? "What did you think about this product?" : "Ask a question or share a helpful tip…"} rows={4} className="w-full resize-y rounded-xl border border-brand-green/15 bg-brand-cream/25 p-3.5 text-sm leading-6 text-brand-charcoal outline-none transition focus:border-brand-green/45 focus:bg-white focus:ring-4 focus:ring-brand-green/5" /><span className="mt-1 block text-right text-[11px] text-brand-charcoal/40">{content.length}/1,200</span></label>
                  {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-brand-charcoal/50">Posting as a signed-in Pink Farm customer</p><button type="submit" disabled={isSaving || content.trim().length < 2 || (activeForm === "review" && rating === 0)} className="inline-flex items-center gap-2 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-green/15 transition-all hover:-translate-y-0.5 hover:bg-brand-green-light disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50">{isSaving ? "Saving…" : activeForm === "review" ? myReview ? "Update review" : "Share review" : "Post comment"}<Send size={14} /></button></div>
                </motion.form>
              )}
            </AnimatePresence>

            {notice && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-800"><Check size={16} />{notice}</p>}
            {!activeForm && error && <p role="status" className="mb-4 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">{error}</p>}

            <div className="space-y-3">
              {isLoading ? <div className="space-y-3" aria-label="Loading customer feedback">{[1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-brand-cream/70" />)}</div> : visibleEntries.length ? visibleEntries.map((entry) => (
                <motion.article key={entry.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-brand-green/8 bg-white p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-champagne text-sm font-bold text-brand-green">{entry.author.trim().charAt(0).toUpperCase() || "P"}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-brand-green">{entry.author}</p><time dateTime={entry.createdAt} className="text-[11px] text-brand-charcoal/45">{new Date(entry.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time></div></div>{entry.rating && <div className="flex shrink-0 gap-0.5 text-amber-400" aria-label={`${entry.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} className={star <= entry.rating! ? "fill-current" : "text-amber-300/35"} />)}</div>}</div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-brand-charcoal/75">{entry.content}</p>
                </motion.article>
              )) : feedbackLoadError ? <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center"><p className="font-semibold text-amber-950">Customer feedback couldn’t load.</p><p className="mt-1 text-sm text-amber-900/70">{feedbackLoadError}</p><button type="button" onClick={() => void loadFeedback()} className="mt-3 text-sm font-bold text-brand-green underline underline-offset-4">Try again</button></div> : <div className="rounded-2xl border border-dashed border-brand-green/15 bg-brand-cream/25 px-5 py-9 text-center"><span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-green/65 shadow-sm">{activeTab === "review" ? <Star size={20} /> : <MessageCircle size={20} />}</span><h3 className="font-serif text-lg font-semibold text-brand-green">{activeTab === "review" ? "Be the first to share a review" : "Start the conversation"}</h3><p className="mt-1 text-sm text-brand-charcoal/55">There are no {activeTab === "review" ? "reviews" : "comments"} yet. Your voice can help someone choose.</p><button type="button" onClick={() => startForm(activeTab)} className="mt-4 text-sm font-bold text-brand-green underline decoration-brand-green/30 underline-offset-4 hover:decoration-brand-green">{activeTab === "review" ? "Write the first review" : "Add the first comment"}</button></div>}
            </div>
            {!isLoading && visibleEntries.length > 0 && <p className="mt-4 text-center text-[11px] text-brand-charcoal/40">Showing the latest {visibleEntries.length} {activeTab === "review" ? "reviews" : "comments"}.</p>}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showAccountPrompt && (
          <motion.div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#10271f]/65 p-4 backdrop-blur-sm sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAccountPrompt(false); }}>
            <motion.div role="dialog" aria-modal="true" aria-labelledby="account-prompt-title" aria-describedby="account-prompt-description" initial={{ opacity: 0, y: 26, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.97 }} transition={{ type: "spring", stiffness: 280, damping: 25 }} className="relative my-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-brand-ivory p-7 shadow-2xl sm:p-9">
              <button type="button" onClick={() => setShowAccountPrompt(false)} aria-label="Close account message" className="absolute right-4 top-4 rounded-full p-2 text-brand-charcoal/45 transition hover:bg-brand-green/5 hover:text-brand-green"><X size={18} /></button>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-green to-[#37785a] text-white shadow-lg shadow-brand-green/20"><ShieldCheck size={29} /></div>
              <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-green/55">A little Pink Farm welcome</p>
              <h2 id="account-prompt-title" className="mt-2 text-center font-serif text-3xl font-semibold text-brand-green">Your voice deserves a place.</h2>
              <p id="account-prompt-description" className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-brand-charcoal/65">Please create a registered Pink Farm account or sign in before sharing a review or comment. It helps keep our community genuine.</p>
              <div className="mt-7 grid gap-3">
                <Link href={`/login?register=1&redirect=${encodeURIComponent(productPath)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-green/15 transition-all hover:-translate-y-0.5 hover:bg-brand-green-light">Create your account <span aria-hidden="true">→</span></Link>
                <Link href={`/login?redirect=${encodeURIComponent(productPath)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-green/15 bg-white px-5 py-3.5 text-sm font-bold text-brand-green transition-colors hover:bg-brand-cream">Sign in to your account</Link>
              </div>
              <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-brand-charcoal/45"><ShieldCheck size={13} /> Your account keeps community feedback accountable.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
