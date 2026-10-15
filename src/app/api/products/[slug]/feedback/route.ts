import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
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

    const [reviews, comments, ratingSummary, ratingCounts, myReview] = await Promise.all([
      prisma.productReview.findMany({
        where: { productId: product.id },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.productComment.findMany({
        where: { productId: product.id },
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
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
    ]);

    return NextResponse.json({
      reviews: reviews.map(presentEntry),
      comments: comments.map(presentEntry),
      averageRating: ratingSummary._avg.rating ?? 0,
      reviewCount: ratingSummary._count._all,
      ratingDistribution: [5, 4, 3, 2, 1].map((rating) => ({ rating, count: ratingCounts[rating - 1] })),
      myReview,
    });
  } catch (error) {
    console.error("Could not load product feedback:", error);
    return NextResponse.json({ error: "Customer feedback is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = await getCustomerSession();
    const customerId = typeof session?.userId === "string" ? session.userId : "";
    if (!customerId || !/^[a-f\d]{24}$/i.test(customerId)) {
      return NextResponse.json({ error: "Please create an account or sign in to share feedback.", code: "ACCOUNT_REQUIRED" }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      return NextResponse.json({ error: "Please create an account or sign in to share feedback.", code: "ACCOUNT_REQUIRED" }, { status: 401 });
    }

    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "This product is no longer available." }, { status: 404 });

    const body = await request.json().catch(() => ({}));
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
    console.error("Could not save product feedback:", error);
    return NextResponse.json({ error: "We couldn’t save your feedback right now. Please try again." }, { status: 500 });
  }
}
