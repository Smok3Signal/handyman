import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TECHNICIAN") return NextResponse.json({ error: "Technicians only" }, { status: 403 });

    const { id: signalId } = await params;
    const { proposedPrice, message } = await req.json();

    if (!proposedPrice || !message) {
      return NextResponse.json({ error: "proposedPrice and message are required" }, { status: 400 });
    }

    const signal = await prisma.distressSignal.findUnique({ where: { id: signalId } });
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    if (signal.status !== "ACTIVE") return NextResponse.json({ error: "Signal is no longer active" }, { status: 409 });
    if (new Date() > signal.expiresAt) return NextResponse.json({ error: "Signal has expired" }, { status: 409 });

    const proposal = await prisma.distressProposal.create({
      data: {
        signalId,
        technicianId: session.user.id,
        proposedPrice: parseFloat(proposedPrice),
        message,
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            technicianProfile: { select: { serviceCategory: true, averageRating: true, totalReviews: true } },
          },
        },
      },
    });

    // Notify employer
    await prisma.notification.create({
      data: {
        userId: signal.employerId,
        title: "New Proposal on Your Signal",
        message: `${proposal.technician.name} submitted a proposal for ₦${parseFloat(proposedPrice).toLocaleString()}`,
        type: "DISTRESS_PROPOSAL",
        link: `/employer/distress/${signalId}`,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    // Unique constraint → already proposed
    if (error.code === "P2002") {
      return NextResponse.json({ error: "You have already submitted a proposal for this signal" }, { status: 409 });
    }
    console.error("Propose POST error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}