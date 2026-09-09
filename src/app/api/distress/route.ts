import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateDistance } from "@/lib/utils";

// POST — employer broadcasts a distress signal
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Employers only" }, { status: 403 });

    const {
      title,
      serviceCategory,
      description,
      category,
      urgencyLevel,
      budget,
      offeredPrice,
      latitude,
      longitude,
      address,
      radiusKm,
      expiresInHours = 6,
    } = await req.json();

    const resolvedCategory = category || serviceCategory;
    const resolvedBudget   = budget ?? offeredPrice;
    const resolvedTitle    = title || description?.slice(0, 60) || "Distress Signal";

    if (!description || !resolvedCategory || !latitude || !longitude) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const signal = await prisma.distressSignal.create({
      data: {
        employerId: session.user.id,
        title:      resolvedTitle,
        description,
        category:   resolvedCategory,
        budget:     resolvedBudget ? parseFloat(String(resolvedBudget)) : null,
        latitude:   parseFloat(latitude),
        longitude:  parseFloat(longitude),
        radiusKm:   radiusKm ? parseFloat(radiusKm) : 20,
        expiresAt,
      },
      include: { employer: { select: { id: true, name: true, phone: true } } },
    });

    const employerName = signal.employer.name;

    // Notify nearby available technicians in the same category
    const technicians = await prisma.user.findMany({
      where: {
        role: "TECHNICIAN",
        isAvailable: true,
        technicianProfile: {
          serviceCategory: { contains: resolvedCategory, mode: "insensitive" },
        },
        latitude:  { not: null },
        longitude: { not: null },
      },
      select: { id: true, latitude: true, longitude: true },
    });

    const resolvedRadius = radiusKm ? parseFloat(radiusKm) : 20;

    const nearby = technicians.filter((t) => {
      if (!t.latitude || !t.longitude) return false;
      return calculateDistance(latitude, longitude, t.latitude, t.longitude) <= resolvedRadius;
    });

    if (nearby.length > 0) {
      await prisma.notification.createMany({
        data: nearby.map((t) => ({
          userId:  t.id,
          title:   "🚨 Distress Signal",
          message: `Urgent job nearby from ${employerName}: ${resolvedTitle}`,
          type:    "DISTRESS_SIGNAL",
          link:    `/technician/distress/${signal.id}`,
        })),
      });
    }

    return NextResponse.json(signal, { status: 201 });
  } catch (error) {
    console.error("Distress POST error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET — technician fetches active signals nearby, employer fetches their own
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = new Date();

    // Employer: return their own signals
    if (session.user.role === "EMPLOYER") {
      const signals = await prisma.distressSignal.findMany({
        where:   { employerId: session.user.id },
        include: { _count: { select: { proposals: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(signals);
    }

    // Technician: return active signals within their location radius
    const { searchParams } = new URL(req.url);
    const lat      = parseFloat(searchParams.get("lat") || "0");
    const lng      = parseFloat(searchParams.get("lng") || "0");
    const category = searchParams.get("category") || "";

    const signals = await prisma.distressSignal.findMany({
      where: {
        expiresAt: { gt: now },
        ...(category && { category: { contains: category, mode: "insensitive" } }),
      },
      include: {
        employer: { select: { id: true, name: true, profileImage: true } },
        _count:   { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by distance if lat/lng provided
    const filtered =
      lat && lng
        ? signals.filter((s) => calculateDistance(lat, lng, s.latitude, s.longitude) <= s.radiusKm)
        : signals;

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Distress GET error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}