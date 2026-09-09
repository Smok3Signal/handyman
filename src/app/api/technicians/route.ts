import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDistance } from "@/lib/utils";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "100");
    const category = searchParams.get("category") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999999");
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const minExperience = parseInt(searchParams.get("minExperience") || "0");

    // Get available technician IDs
    const availableIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "User" WHERE "isAvailable" = true AND role = 'TECHNICIAN'`
    );
    const availableIdSet = new Set(availableIds.map((u) => u.id));

    const technicians = await prisma.user.findMany({
      where: {
        role: "TECHNICIAN",
        technicianProfile: {
          ...(category && {
            serviceCategory: { contains: category, mode: "insensitive" },
          }),
          ...(minRating > 0 && { averageRating: { gte: minRating } }),
          ...(minExperience > 0 && { yearsOfExperience: { gte: minExperience } }),
          ...(minPrice > 0 && { basePrice: { gte: minPrice } }),
          ...(maxPrice < 999999999 && { basePrice: { lte: maxPrice } }),
        },
      },
      include: {
        technicianProfile: true,
        _count: {
          select: {
            jobRequestsAsTechnician: {
              where: { status: "SATISFIED" },
            },
          },
        },
      },
    });

    // Filter unavailable technicians
    const availableTechnicians = technicians.filter((t) =>
      availableIdSet.has(t.id)
    );

    // Check each technician for active dispute notices
    const now = new Date();
    const techniciansWithNotices = await Promise.all(
      availableTechnicians.map(async (t) => {
        try {
          const activeNotice = await prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM "Dispute"
             WHERE "technicianId" = $1
             AND "noticePlaced" = true
             AND "noticeExpiresAt" > $2
             AND status = 'RESOLVED_EMPLOYER'
             LIMIT 1`,
            t.id,
            now
          );
          return {
            ...t,
            hasUnsatisfactoryNotice: activeNotice.length > 0,
          };
        } catch {
          return { ...t, hasUnsatisfactoryNotice: false };
        }
      })
    );

    // Compute score to identify global top 10 performers
    const scored = techniciansWithNotices.map((t) => ({
      ...t,
      score:
        (t.technicianProfile?.averageRating || 0) * 0.4 * 10 +
        (t._count?.jobRequestsAsTechnician || 0) * 0.6,
    }));

    // Sort by score descending, take the top 10 IDs
    const sortedByScore = [...scored].sort((a, b) => b.score - a.score);
    const top10Ids = new Set(sortedByScore.slice(0, 10).map((t) => t.id));

    const nearby = scored
      .filter((t) => t.latitude && t.longitude)
      .map((t) => {
        const isTopPerformer = top10Ids.has(t.id);
        const actualDistance = calculateDistance(lat, lng, t.latitude!, t.longitude!);
        // Top performers get an effective distance 12 km closer (minimum 0), so they
        // sort higher in the results. We expose the real distance to the UI.
        const effectiveDistance = isTopPerformer
          ? Math.max(0, actualDistance - 12)
          : actualDistance;
        return {
          ...t,
          isTopPerformer,
          distance: actualDistance,        // shown in UI
          effectiveDistance,               // used for sorting + radius gate
        };
      })
      .filter((t) => t.effectiveDistance <= radius)
      .sort((a, b) => a.effectiveDistance - b.effectiveDistance)
      .map(({ password, effectiveDistance, score, ...t }) => t); // strip internal fields

    return NextResponse.json(nearby);
  } catch (error) {
    console.error("Technicians GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}