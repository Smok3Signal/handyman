import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  const skip = (page - 1) * limit;
  const category = searchParams.get("category") || "";

  const where = {
    role: "TECHNICIAN" as const,
    isAvailable: true,
    technicianProfile: {
      ...(category && {
        serviceCategory: { contains: category, mode: "insensitive" as const },
      }),
    },
  };

  const [technicians, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      orderBy: [
        { technicianProfile: { averageRating: "desc" } },
      ],
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Sort by combined score: rating * 0.4 + completedJobs * 0.6
  const ranked = technicians
    .map((t) => ({
      ...t,
      completedJobs: t._count.jobRequestsAsTechnician,
      score:
        (t.technicianProfile?.averageRating || 0) * 0.4 * 10 +
        t._count.jobRequestsAsTechnician * 0.6,
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ password, ...t }) => t);

  return NextResponse.json({
    technicians: ranked,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  });
}