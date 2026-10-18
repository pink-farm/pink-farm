import { logServerError } from "@/lib/server-log.mjs";
import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { isSameOriginMutation, readBoundedJson } from "@/lib/request-security.mjs";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ slug: string }> };

function presentEntry(entry: {
  id: string;
  content: string;
  rating?: number;
  createdAt: Date;
  updatedAt?: Date;
  customer: { name: string };
}) {
  return {
    id: entry.id,
    content: entry.content,
    ...(typeof entry.rating === "number" ? { rating: entry.rating } : {}),
    author: entry.customer.name || "Pink Farm customer",
    createdAt: entry.createdAt.toISOString(),
    ...(entry.updatedAt ? { updatedAt: entry.updatedAt.toISOString() } : {}),
    isVerified: true,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const session = await getCustomerSession();
    const customerId = typeof session?.userId === "string" && /^[a-f\d]{24}$/i.test(session.userId)
      ? session.userId
      : undefined;

    const [reviews, comments, ratingSummary, ratingCounts, myReview, hasPurchased] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId: product.id },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.productComment.findMany({
        where: { productId: product.id },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.productReview.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      Promise.all([1, 2, 3, 4, 5].map((rating) => prisma.productReview.count({ where: { productId: product.id, rating } }))),
      customerId
        ? prisma.productReview.findUnique({
            where: { productId_customerId: { productId: product.id, customerId } },
            select: { id: true, rating: true, content: true },
          })
        : Promise.resolve(null),
      customerId
        ? prisma.orderItem.findFirst({
            where: {
              productId: product.id,
              order: { customerId },
            },
            select: { id: true },
          }).then((item) => Boolean(item))
        : Promise.resolve(false),
    ]);

    return NextResponse.json({
      reviews: reviews.map(presentEntry),
      comments: comments.map(presentEntry),
      averageRating: ratingSummary._avg.rating ?? 0,
      reviewCount: ratingSummary._count._all,
      ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: ratingCounts[rating - 1] })),
      myReview,
      hasPurchased,
    });
  } catch (error) {
    logServerError("security.products/slug.feedback.failed", error);
    return NextResponse.json({ error: "Customer feedback is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "This product is no longer available." }, { status: 404 });

    const parsed = await readBoundedJson(request, 8_000);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) return NextResponse.json({ error: "Feedback must be a JSON object." }, { status: 400 });
    const body = parsed.value as Record<string, unknown>;

    const session = await getCustomerSession();
    const customerId = typeof session?.userId === "string" ? session.userId : "";

    let customer: { id: string; name: string } | null = null;
    if (customerId && /^[a-f\d]{24}$/i.test(customerId)) {
      customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true },
      });
    }

    if (!customer) {
      const authorName = typeof body?.authorName === "string" ? body.authorName.trim() : "";
      const authorEmail = typeof body?.authorEmail === "string" ? body.authorEmail.trim().toLowerCase() : "";
      if (authorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail) && authorName.length >= 2) {
        customer = await prisma.customer.upsert({
          where: { email: authorEmail },
          update: { name: authorName },
          create: { email: authorEmail, name: authorName },
          select: { id: true, name: true },
        });
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Please sign in or enter your name and email to share a review.", code: "ACCOUNT_REQUIRED" }, { status: 401 });
    }

    const kind = body?.kind;
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (content.length < 2 || content.length > 1200) {
      return NextResponse.json({ error: "Write between 2 and 1,200 characters." }, { status: 400 });
    }

    if (kind === "review") {
      const rating = Number(body?.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return NextResponse.json({ error: "Choose a rating from 1 to 5 stars." }, { status: 400 });
      }

      const review = await prisma.productReview.upsert({
        where: { productId_customerId: { productId: product.id, customerId: customer.id } },
        create: { productId: product.id, customerId: customer.id, rating, content },
        update: { rating, content },
        include: { customer: { select: { name: true } } },
      });
      return NextResponse.json({ review: presentEntry(review), message: "Your review has been saved." });
    }

    if (kind === "comment") {
      const recentComments = await prisma.productComment.count({
        where: { customerId: customer.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      });
      if (recentComments >= 10) {
        return NextResponse.json({ error: "You’ve reached the comment limit for this hour. Please try again later." }, { status: 429 });
      }

      const comment = await prisma.productComment.create({
        data: { productId: product.id, customerId: customer.id, content },
        include: { customer: { select: { name: true } } },
      });
      return NextResponse.json({ comment: presentEntry(comment), message: "Your comment has been posted." }, { status: 201 });
    }

    return NextResponse.json({ error: "Choose whether to submit a review or comment." }, { status: 400 });
  } catch (error) {
    logServerError("security.products/slug.feedback.failed", error);
    return NextResponse.json({ error: "We couldn’t save your feedback right now. Please try again." }, { status: 500 });
  }
}
