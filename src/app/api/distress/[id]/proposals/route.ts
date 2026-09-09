import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: signalId } = await params;

    const signal = await prisma.distressSignal.findUnique({ where: { id: signalId } });
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    if (signal.employerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const proposals = await prisma.distressProposal.findMany({
      where: { signalId },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
            profileImage: true,
            technicianProfile: {
              select: {
                businessName: true,
                serviceCategory: true,
                averageRating: true,
                totalReviews: true,
                yearsOfExperience: true,
                rank: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ signal, proposals });
  } catch (error) {
    console.error("Proposals GET error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Technicians only" }, { status: 403 });
    }

    const { id: signalId } = await params;
    const { price, message } = await req.json();

    if (!price || isNaN(parseFloat(String(price)))) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    // Confirm signal exists and is still active
    const signal = await prisma.distressSignal.findUnique({
      where: { id: signalId },
    });
    if (!signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }
    if (signal.status !== "ACTIVE") {
      return NextResponse.json({ error: "Signal is no longer active" }, { status: 409 });
    }
    if (new Date(signal.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Signal has expired" }, { status: 409 });
    }

    // Prevent duplicate proposals from the same technician
    const existing = await prisma.distressProposal.findFirst({
      where: { signalId, technicianId: session.user.id },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already submitted a proposal" }, { status: 409 });
    }

    const proposal = await prisma.distressProposal.create({
      data: {
        signalId,
        technicianId:  session.user.id,
        proposedPrice: parseFloat(String(price)),
        message:       message || "",
      },
    });

    // Notify the employer
    await prisma.notification.create({
      data: {
        userId:  signal.employerId,
        title:   "📋 New Distress Proposal",
        message: `A technician submitted a proposal for your distress signal.`,
        type:    "JOB_UPDATE",
        link:    `/employer/dashboard`,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Proposals POST error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}