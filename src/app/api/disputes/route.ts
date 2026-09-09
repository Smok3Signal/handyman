import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Auto-set resolution window at filing time. Admin can adjust later (6-24h)
// via PATCH /api/admin/disputes { action: "SET_DEADLINE" }.
const DEFAULT_WINDOW_HOURS = 6;

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobRequestId, reason } = await req.json();
    const employerId = (session.user as any).id;

    // Get the job details
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      include: {
        employer: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Create dispute using raw query to bypass type issues
    const disputeId = `dispute_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const now = new Date();
    const nowStr = now.toISOString();

    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() + DEFAULT_WINDOW_HOURS);
    const deadlineStr = deadline.toISOString();

    // Job photos (arrivedImages / completedImages) live directly on
    // JobRequest and need no separate "transfer" step — the admin GET already
    // joins them live. What actually happens "on filing" is: the dispute row
    // is created, the resolution window opens, and the technician is told
    // their job photos have been forwarded for review.
    await prisma.$executeRaw`
      INSERT INTO "Dispute" (
        id, "jobRequestId", "employerId", "technicianId",
        reason, status, "rankDocked", "resolutionDeadline", "createdAt", "updatedAt"
      )
      VALUES (
        ${disputeId}, ${jobRequestId}, ${employerId},
        ${job.technicianId}, ${reason}, 'OPEN', true,
        ${deadlineStr}::timestamp, ${nowStr}::timestamp, ${nowStr}::timestamp
      )
    `;

    // Mark job as DISPUTED using raw query to bypass enum type issue
    await prisma.$executeRaw`
      UPDATE "JobRequest"
      SET status = 'DISPUTED'
      WHERE id = ${jobRequestId}
    `;

    // Dock technician rating temporarily — restored on TECHNICIAN_WINS or on
    // WITHDRAW (see /api/disputes/[id] PATCH), since this is a provisional
    // penalty, not a final judgment.
    const profileRaw = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "averageRating" FROM "TechnicianProfile" WHERE "userId" = $1`,
      job.technicianId
    );

    if (profileRaw && profileRaw.length > 0) {
      const currentRating = parseFloat(profileRaw[0].averageRating) || 0;
      const newRating = Math.max(0, currentRating - 0.5);
      await prisma.$executeRawUnsafe(
        `UPDATE "TechnicianProfile" SET "averageRating" = $1 WHERE "userId" = $2`,
        newRating,
        job.technicianId
      );
    }

    // Notify technician — no countdown shown, just confirmation that their
    // job photos are already with the admin. Their only further input is a
    // one-time defense statement + defense photos; no separate evidence
    // upload channel exists, by design, so it can't be filed after the fact
    // with knowledge of the dispute already in mind.
    await prisma.notification.create({
      data: {
        userId: job.technicianId,
        title: "Dispute Filed Against You",
        message: `${job.employer.name} has filed a dispute on this job. Your on-arrival and on-completion photos have been forwarded to the admin for review. You can submit a one-time defense statement with supporting photos from your disputes page before the admin reaches a decision.`,
        type: "JOB_UPDATE",
        link: "/technician/disputes",
      },
    });

    return NextResponse.json(
      { id: disputeId, status: "OPEN", resolutionDeadline: deadlineStr },
      { status: 201 }
    );
  } catch (error) {
    console.error("Dispute POST error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Use separate queries based on role to avoid dynamic SQL issues
    let disputes: any[] = [];

    if (role === "EMPLOYER") {
      disputes = await prisma.$queryRaw`
        SELECT
          d.*,
          e.name as "employerName",
          t.name as "technicianName",
          tp."serviceCategory"
        FROM "Dispute" d
        LEFT JOIN "User" e ON d."employerId" = e.id
        LEFT JOIN "User" t ON d."technicianId" = t.id
        LEFT JOIN "TechnicianProfile" tp ON t.id = tp."userId"
        WHERE d."employerId" = ${userId}
        ORDER BY d."createdAt" DESC
      `;
    } else {
      disputes = await prisma.$queryRaw`
        SELECT
          d.*,
          e.name as "employerName",
          t.name as "technicianName",
          tp."serviceCategory"
        FROM "Dispute" d
        LEFT JOIN "User" e ON d."employerId" = e.id
        LEFT JOIN "User" t ON d."technicianId" = t.id
        LEFT JOIN "TechnicianProfile" tp ON t.id = tp."userId"
        WHERE d."technicianId" = ${userId}
        ORDER BY d."createdAt" DESC
      `;
    }

    // Format results into clean structure
    const formatted = disputes.map((d: any) => ({
      id: d.id,
      jobRequestId: d.jobRequestId,
      reason: d.reason,
      status: d.status,
      outcome: d.outcome,
      defenseStatement: d.defenseStatement,
      defenseImages: d.defenseImages || [],
      defendedAt: d.defendedAt,
      resolvedAt: d.resolvedAt,
      resolutionDeadline: d.resolutionDeadline,
      rankDocked: d.rankDocked,
      noticePlaced: d.noticePlaced,
      noticeExpiresAt: d.noticeExpiresAt,
      createdAt: d.createdAt,
      employer: {
        id: d.employerId,
        name: d.employerName,
      },
      technician: {
        id: d.technicianId,
        name: d.technicianName,
        technicianProfile: {
          serviceCategory: d.serviceCategory,
        },
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Dispute GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}