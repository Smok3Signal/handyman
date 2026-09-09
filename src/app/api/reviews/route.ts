import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobRequestId, revieweeId, rating, comment } =
      await req.json();
    const reviewerId = (session.user as any).id;

    // Check if this job was disputed using raw query
    // to avoid enum type mismatch issues
    const jobRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT status FROM "JobRequest" WHERE id = $1`,
      jobRequestId
    );

    const isAfterDispute =
      jobRaw.length > 0 && jobRaw[0].status === "DISPUTED";

    // Build comment with dispute flag prefix if applicable
    const finalComment = isAfterDispute
      ? `[AFTER_DISPUTE]${comment || ""}`
      : comment || "";

    // Create the review
    const review = await prisma.review.create({
      data: {
        jobRequestId,
        reviewerId,
        revieweeId,
        rating,
        comment: finalComment,
      },
    });

    // Update technician average rating
    const allReviews = await prisma.review.findMany({
      where: { revieweeId },
    });

    const avg =
      allReviews.reduce((sum, r) => sum + r.rating, 0) /
      allReviews.length;

    await prisma.technicianProfile.update({
      where: { userId: revieweeId },
      data: {
        averageRating: avg,
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json(
      { ...review, isAfterDispute },
      { status: 201 }
    );
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}