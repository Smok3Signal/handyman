import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { calculateRank } from "@/lib/utils";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin-secret"
);

// Resolution window bounds, in hours. Auto-set at filing time to the floor (6h).
// Admin can move it anywhere in this range via SET_DEADLINE.
const MIN_WINDOW_HOURS = 6;
const MAX_WINDOW_HOURS = 24;

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

// ── GET — all disputes with full evidence ────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const disputes = await prisma.$queryRaw<any[]>`
      SELECT
        d.*,
        e.id        AS "employerId",
        e.name      AS "employerName",
        e.email     AS "employerEmail",
        t.id        AS "technicianId",
        t.name      AS "technicianName",
        t.email     AS "technicianEmail",
        tp."serviceCategory",
        tp."averageRating",
        tp.rank,
        jr.description      AS "jobDescription",
        jr."offeredPrice",
        jr."counterPrice",
        jr."arrivedImages",
        jr."completedImages"
      FROM "Dispute" d
      LEFT JOIN "User" e   ON d."employerId"   = e.id
      LEFT JOIN "User" t   ON d."technicianId" = t.id
      LEFT JOIN "TechnicianProfile" tp ON t.id = tp."userId"
      LEFT JOIN "JobRequest" jr        ON d."jobRequestId" = jr.id
      ORDER BY d."createdAt" DESC
    `;

    const formatted = disputes.map((d) => ({
      id: d.id,
      jobRequestId: d.jobRequestId,
      reason: d.reason,
      status: d.status,
      outcome: d.outcome,
      defenseStatement: d.defenseStatement,
      // defenseImages may come back as parsed array or raw JSON string
      defenseImages: Array.isArray(d.defenseImages)
        ? d.defenseImages
        : d.defenseImages
        ? JSON.parse(d.defenseImages)
        : [],
      // Job photos from the technician's photo capture flow — these are the
      // ONLY technician-side evidence. Live-read from JobRequest, not
      // snapshotted, since they're immutable after job completion anyway.
      arrivedImages: Array.isArray(d.arrivedImages)
        ? d.arrivedImages
        : d.arrivedImages
        ? JSON.parse(d.arrivedImages)
        : [],
      completedImages: Array.isArray(d.completedImages)
        ? d.completedImages
        : d.completedImages
        ? JSON.parse(d.completedImages)
        : [],
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
        email: d.employerEmail,
      },
      technician: {
        id: d.technicianId,
        name: d.technicianName,
        email: d.technicianEmail,
        technicianProfile: {
          serviceCategory: d.serviceCategory,
          averageRating: d.averageRating,
          rank: d.rank,
        },
      },
      jobRequest: {
        description: d.jobDescription,
        offeredPrice: d.offeredPrice,
        counterPrice: d.counterPrice,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Admin GET disputes error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}

// ── PATCH — resolve a dispute OR adjust its resolution deadline ─────────────
export async function PATCH(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { disputeId, outcome, action, hoursFromNow } = body;

    const disputes = await prisma.$queryRaw<any[]>`
      SELECT d.*, tp."averageRating"
      FROM "Dispute" d
      LEFT JOIN "TechnicianProfile" tp ON d."technicianId" = tp."userId"
      WHERE d.id = ${disputeId}
    `;

    if (!disputes || disputes.length === 0) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const dispute = disputes[0];
    const now = new Date().toISOString();

    // ── SET_DEADLINE action — admin adjusts the resolution window ─────────
    // Does not resolve the dispute. Clamped to 6-24h from right now, so the
    // admin can't accidentally set something already in the past or absurdly
    // far out.
    if (action === "SET_DEADLINE") {
      const hours = Math.min(
        MAX_WINDOW_HOURS,
        Math.max(MIN_WINDOW_HOURS, Number(hoursFromNow) || MIN_WINDOW_HOURS)
      );
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + hours);
      const deadlineStr = deadline.toISOString();

      await prisma.$executeRaw`
        UPDATE "Dispute"
        SET "resolutionDeadline" = ${deadlineStr}::timestamp, "updatedAt" = ${now}::timestamp
        WHERE id = ${disputeId}
      `;

      return NextResponse.json({ success: true, resolutionDeadline: deadlineStr });
    }

    // ── Resolve (existing logic, outcome-driven) ───────────────────────────
    if (outcome === "TECHNICIAN_WINS") {
      const restoredRating = Math.min(5, (parseFloat(dispute.averageRating) || 0) + 0.5);
      const completedCount = await prisma.jobRequest.count({
        where: { technicianId: dispute.technicianId, status: "SATISFIED" },
      });
      const newRank = calculateRank(completedCount, restoredRating);

      await prisma.$executeRaw`
        UPDATE "TechnicianProfile"
        SET "averageRating" = ${restoredRating}, rank = ${newRank}
        WHERE "userId" = ${dispute.technicianId}
      `;
      await prisma.$executeRaw`
        UPDATE "Dispute"
        SET status = 'RESOLVED_TECHNICIAN', outcome = 'TECHNICIAN_WINS',
            "resolvedAt" = ${now}::timestamp, "rankDocked" = false
        WHERE id = ${disputeId}
      `;
      await prisma.$executeRaw`
        UPDATE "JobRequest" SET status = 'SATISFIED' WHERE id = ${dispute.jobRequestId}
      `;

      await prisma.notification.create({
        data: {
          userId: dispute.technicianId,
          title: "Dispute Resolved — You Won! 🎉",
          message: "The admin reviewed your evidence and ruled in your favor. Your rank points have been restored.",
          type: "JOB_UPDATE",
          link: "/technician/disputes",
        },
      });
      await prisma.notification.create({
        data: {
          userId: dispute.employerId,
          title: "Dispute Resolved",
          message: "After reviewing the evidence, the admin ruled in favor of the technician. If you still have concerns, please contact support.",
          type: "JOB_UPDATE",
          link: "/employer/jobs",
        },
      });
    } else if (outcome === "EMPLOYER_WINS") {
      const newRating = Math.max(0, (parseFloat(dispute.averageRating) || 0) - 0.5);
      const completedCount = await prisma.jobRequest.count({
        where: { technicianId: dispute.technicianId, status: "SATISFIED" },
      });
      const newRank = calculateRank(completedCount, newRating);
      const noticeExpiry = new Date();
      noticeExpiry.setDate(noticeExpiry.getDate() + 60);
      const noticeExpiryStr = noticeExpiry.toISOString();

      await prisma.$executeRaw`
        UPDATE "TechnicianProfile"
        SET "averageRating" = ${newRating}, rank = ${newRank}
        WHERE "userId" = ${dispute.technicianId}
      `;
      await prisma.$executeRaw`
        UPDATE "Dispute"
        SET status = 'RESOLVED_EMPLOYER', outcome = 'EMPLOYER_WINS',
            "resolvedAt" = ${now}::timestamp,
            "noticePlaced" = true, "noticeExpiresAt" = ${noticeExpiryStr}::timestamp
        WHERE id = ${disputeId}
      `;

      await prisma.notification.create({
        data: {
          userId: dispute.technicianId,
          title: "Dispute Resolved — Employer Won ⚠️",
          message: "The admin reviewed the evidence and ruled in favor of the employer. Your rank has been docked and a notice has been placed on your profile for 60 days.",
          type: "JOB_UPDATE",
          link: "/technician/disputes",
        },
      });
      await prisma.notification.create({
        data: {
          userId: dispute.employerId,
          title: "Dispute Resolved — You Won ✅",
          message: "The admin reviewed the evidence and ruled in your favor. We apologize for the inconvenience.",
          type: "JOB_UPDATE",
          link: "/employer/jobs",
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin PATCH dispute error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}