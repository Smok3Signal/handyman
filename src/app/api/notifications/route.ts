import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Get all notifications for logged-in user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

// Mark notification as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, markAllRead } = await req.json();
  const userId = (session.user as any).id;

  if (markAllRead) {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } else {
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}