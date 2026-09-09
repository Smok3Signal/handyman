import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/distress/[id] — fetch single signal with proposals (employer only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const signal = await prisma.distressSignal.findUnique({
      where: { id },
      include: {
        proposals: {
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
        },
      },
    });

    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    if (signal.employerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(signal);
  } catch (error) {
    console.error("Distress GET [id] error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH /api/distress/[id] — cancel signal (employer only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const signal = await prisma.distressSignal.findUnique({ where: { id } });
    if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    if (signal.employerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.distressSignal.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Distress PATCH [id] error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}