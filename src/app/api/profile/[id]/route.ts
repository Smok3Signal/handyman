import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Get public technician profile by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        technicianProfile: true,
        portfolioItems: { orderBy: { createdAt: "desc" } },
        availability: true,
        reviewsReceived: {
          include: {
            reviewer: { select: { name: true, profileImage: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user || !user.technicianProfile) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    const rawUser = await prisma.$queryRaw<{ isAvailable: boolean }[]>`
      SELECT "isAvailable" FROM "User" WHERE id = ${id}
    `;

    const { password, ...safeUser } = user;

    return NextResponse.json({
      ...safeUser,
      isAvailable: rawUser[0]?.isAvailable ?? true,
    });
  } catch (error) {
    console.error("Profile [id] GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}