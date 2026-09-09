import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Get availability for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const availability = await prisma.availability.findMany({
    where: { userId },
  });

  return NextResponse.json(availability.map((a) => a.dayOfWeek));
}

// Toggle availability for a day
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dayOfWeek } = await req.json();
  const userId = (session.user as any).id;

  // Check if exists
  const existing = await prisma.availability.findUnique({
    where: { userId_dayOfWeek: { userId, dayOfWeek } },
  });

  if (existing) {
    // Toggle: delete if exists
    await prisma.availability.delete({
      where: { userId_dayOfWeek: { userId, dayOfWeek } },
    });
  } else {
    // Create if doesn't exist
    await prisma.availability.create({
      data: { userId, dayOfWeek },
    });
  }

  // Return updated availability
  const updated = await prisma.availability.findMany({ where: { userId } });
  return NextResponse.json(updated.map((a) => a.dayOfWeek));
}