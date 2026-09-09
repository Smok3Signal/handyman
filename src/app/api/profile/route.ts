import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Get own profile
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      technicianProfile: true,
      portfolioItems: { orderBy: { createdAt: "desc" } },
      availability: true,
      reviewsReceived: {
        include: { reviewer: { select: { id: true, name: true, profileImage: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { password, ...safeUser } = user as any;
  return NextResponse.json(safeUser);
}

// Update profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const {
    name, phone, profileImage, address, latitude, longitude,
    // Technician fields
    businessName, serviceCategory, yearsOfExperience,
    basePrice, description, officeAddress,
  } = body;

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(address !== undefined && { address }),
      ...(profileImage && { profileImage }),
      ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
      ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
    },
  });

  // Update technician profile if applicable
  const role = (session.user as any).role;
  if (role === "TECHNICIAN") {
    await prisma.technicianProfile.update({
      where: { userId },
      data: {
        ...(businessName && { businessName }),
        ...(serviceCategory && { serviceCategory }),
        ...(yearsOfExperience && { yearsOfExperience: parseInt(yearsOfExperience) }),
        ...(basePrice && { basePrice: parseFloat(basePrice) }),
        ...(description && { description }),
        ...(officeAddress !== undefined && { officeAddress }),
      },
    });
  }

  return NextResponse.json({ success: true });
}