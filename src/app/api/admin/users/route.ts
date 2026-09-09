import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "admin-secret"
);

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

// Get all users (employers + technicians) for the admin account viewer
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        address: true,
        latitude: true,
        longitude: true,
        profileImage: true,
        createdAt: true,
        suspended: true,
        isAvailable: true,
        technicianProfile: {
          select: {
            businessName: true,
            serviceCategory: true,
            basePrice: true,
            averageRating: true,
            totalReviews: true,
            rank: true,
            yearsOfExperience: true,
            officeAddress: true,
          },
        },
        _count: {
          select: {
            jobRequestsAsEmployer: true,
            jobRequestsAsTechnician: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Password is never selected above — nothing to strip, nothing to leak.
    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin GET users error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}