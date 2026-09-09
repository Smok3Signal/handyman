import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/distress/[id]/accept
// Body: { proposalId: string, action: "ACCEPT" | "COUNTER" | "REJECT", counterPrice?: number, counterMessage?: string }
//
// ACCEPT  → JobRequest created as ACCEPTED (technician's next step is "On my way")
//           Signal marked ACCEPTED, all other proposals rejected
// COUNTER → JobRequest created as EMPLOYER_COUNTERED with counterPrice + message
//           Signal marked ACCEPTED (signal is done — negotiation moves to jobs page)
//           All other proposals rejected
// REJECT  → Proposal marked REJECTED, signal stays ACTIVE

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: signalId } = await params;
    const { proposalId, action, counterPrice, counterMessage } = await req.json();

    if (!proposalId || !["ACCEPT", "COUNTER", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === "COUNTER") {
      if (!counterPrice || isNaN(Number(counterPrice)) || Number(counterPrice) <= 0) {
        return NextResponse.json({ error: "A valid counter price is required" }, { status: 400 });
      }
    }

    // Verify signal belongs to this employer
    const signal = await prisma.distressSignal.findUnique({ where: { id: signalId } });
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    if (signal.employerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (signal.status !== "ACTIVE") {
      return NextResponse.json({ error: "Signal is no longer active" }, { status: 409 });
    }

    // Verify proposal belongs to this signal and is still pending
    const proposal = await prisma.distressProposal.findUnique({
      where: { id: proposalId },
      include: { technician: { select: { id: true, name: true } } },
    });
    if (!proposal || proposal.signalId !== signalId) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    if (proposal.status !== "PENDING") {
      return NextResponse.json({ error: "Proposal already actioned" }, { status: 409 });
    }

    // REJECT — just mark this proposal rejected, signal stays active
    if (action === "REJECT") {
      const updated = await prisma.distressProposal.update({
        where: { id: proposalId },
        data: { status: "REJECTED" },
      });
      return NextResponse.json(updated);
    }

    // ACCEPT or COUNTER — both close the signal and create a JobRequest
    const isAccept = action === "ACCEPT";

    const [jobRequest] = await prisma.$transaction([
      // Create the job request
      prisma.jobRequest.create({
        data: {
          employerId: session.user.id,
          technicianId: proposal.technicianId,
          description: signal.description,
          offeredPrice: isAccept ? proposal.proposedPrice : Number(counterPrice),
          counterPrice: isAccept ? null : Number(counterPrice),
          status: isAccept ? "ACCEPTED" : "EMPLOYER_COUNTERED",
          distressSignalId: signalId,
        },
      }),
      // Mark this proposal accepted
      prisma.distressProposal.update({
        where: { id: proposalId },
        data: { status: "ACCEPTED" },
      }),
      // Close the signal
      prisma.distressSignal.update({
        where: { id: signalId },
        data: { status: "ACCEPTED" },
      }),
      // Reject all other pending proposals
      prisma.distressProposal.updateMany({
        where: { signalId, id: { not: proposalId }, status: "PENDING" },
        data: { status: "REJECTED" },
      }),
      // Notify technician
      prisma.notification.create({
        data: {
          userId: proposal.technicianId,
          title: isAccept ? "Your distress proposal was accepted!" : "Counter offer on your distress proposal",
          message: isAccept
            ? `${session.user.name} accepted your proposal at ₦${proposal.proposedPrice.toLocaleString()}. Head to your jobs — you're hired!`
            : `${session.user.name} countered at ₦${Number(counterPrice).toLocaleString()}${counterMessage ? `: "${counterMessage}"` : ""}. Check your jobs to respond.`,
          type: isAccept ? "DISTRESS_ACCEPTED" : "DISTRESS_COUNTERED",
          link: "/technician/jobs",
        },
      }),
    ]);

    return NextResponse.json({ jobRequest });
  } catch (error) {
    console.error("Distress accept error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}