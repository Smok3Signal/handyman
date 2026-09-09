import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { action, defenseStatement, defenseImages } = body;

    // Get dispute
    const disputes = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Dispute" WHERE id = ${id}
    `;

    if (!disputes || disputes.length === 0) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const dispute = disputes[0];

    // ── DEFEND action (existing) ──────────────────────────────────────────────
    if (action === "DEFEND") {
      // Only the technician on this dispute can defend
      if (dispute.technicianId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const now = new Date();
      const imagesArray = Array.isArray(defenseImages) ? defenseImages : [];

      await prisma.$executeRawUnsafe(
        `UPDATE "Dispute"
         SET status = 'DEFENDING', "defenseStatement" = $1, "defendedAt" = $2, "updatedAt" = $3
         WHERE id = $4`,
        defenseStatement || "",
        now,
        now,
        id
      );

      if (imagesArray.length > 0) {
        const imagesJson = JSON.stringify(imagesArray);
        await prisma.$executeRawUnsafe(
          `UPDATE "Dispute" SET "defenseImages" = $1::jsonb WHERE id = $2`,
          imagesJson,
          id
        );
      }

      await prisma.notification.create({
        data: {
          userId: dispute.technicianId,
          title: "Defense Submitted Successfully ✅",
          message: "Your dispute defense has been submitted. The admin will review it shortly.",
          type: "JOB_UPDATE",
          link: "/technician/disputes",
        },
      });

      return NextResponse.json({ success: true, status: "DEFENDING" });
    }

    // ── WITHDRAW action ─────────────────────────────────────────────────────
    if (action === "WITHDRAW") {
      // Only the employer who filed it can withdraw
      if (dispute.employerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Can only withdraw before the technician has mounted a defense. Once
      // DEFENDING, the employer has seen what they're up against — letting
      // them withdraw at that point would let them dodge consequences after
      // peeking at the technician's case. OPEN and IN_REVIEW are fine;
      // DEFENDING and anything past it are not.
      const withdrawableStatuses = ["OPEN", "IN_REVIEW"];
      if (!withdrawableStatuses.includes(dispute.status)) {
        const reason =
          dispute.status === "DEFENDING"
            ? "This dispute can no longer be withdrawn once the technician has submitted a defense."
            : "This dispute can no longer be withdrawn.";
        return NextResponse.json({ error: reason }, { status: 400 });
      }

      const now = new Date();

      await prisma.$executeRawUnsafe(
        `UPDATE "Dispute"
         SET status = 'WITHDRAWN', "resolvedAt" = $1, "updatedAt" = $2
         WHERE id = $3`,
        now,
        now,
        id
      );

      // Reset the job status back to COMPLETED so the employer can re-evaluate
      await prisma.$executeRawUnsafe(
        `UPDATE "JobRequest" SET status = 'COMPLETED', "updatedAt" = $1 WHERE id = $2`,
        now,
        dispute.jobRequestId
      );

      // The 0.5 rating dock applied at filing was provisional, not a verdict.
      // Withdrawing means no judgment was ever reached, so restore it —
      // otherwise a technician keeps a penalty for a dispute that was dropped.
      const profileRaw = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "averageRating" FROM "TechnicianProfile" WHERE "userId" = $1`,
        dispute.technicianId
      );
      if (profileRaw && profileRaw.length > 0) {
        const currentRating = parseFloat(profileRaw[0].averageRating) || 0;
        const restoredRating = Math.min(5, currentRating + 0.5);
        await prisma.$executeRawUnsafe(
          `UPDATE "TechnicianProfile" SET "averageRating" = $1 WHERE "userId" = $2`,
          restoredRating,
          dispute.technicianId
        );
      }

      // Warning notification to the employer
      await prisma.notification.create({
        data: {
          userId: dispute.employerId,
          title: "Dispute Withdrawn ⚠️",
          message:
            "You've withdrawn your dispute. Please note: repeated or frivolous dispute filings may result in account review. The job has been returned to Completed status.",
          type: "JOB_UPDATE",
          link: "/employer/ongoing",
        },
      });

      // Notify the technician their dispute has been dropped
      await prisma.notification.create({
        data: {
          userId: dispute.technicianId,
          title: "Dispute Withdrawn",
          message:
            "The employer has withdrawn their dispute against you. No further action is needed on your part.",
          type: "JOB_UPDATE",
          link: "/technician/disputes",
        },
      });

      return NextResponse.json({ success: true, status: "WITHDRAWN" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Dispute PATCH error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}