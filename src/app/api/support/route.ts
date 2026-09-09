import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Submit a support ticket
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { category, subject, message } = await req.json();

    if (!category || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Use raw query to bypass Prisma type issue
    const id = `ticket_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = new Date().toISOString();

    await prisma.$executeRaw`
      INSERT INTO "SupportTicket" (id, "userId", category, subject, message, status, "createdAt", "updatedAt")
      VALUES (${id}, ${userId}, ${category}, ${subject}, ${message}, 'OPEN', ${now}::timestamp, ${now}::timestamp)
    `;

    // Notify user
    await prisma.notification.create({
      data: {
        userId,
        title: "Support Ticket Submitted",
        message: `Your ticket "${subject}" has been received. We will get back to you soon.`,
        type: "MESSAGE",
        link: "/support",
      },
    });

    return NextResponse.json({ id, category, subject, message, status: "OPEN" }, { status: 201 });
  } catch (error) {
    console.error("Support POST error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}

// Get user's own tickets
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Use raw query to bypass Prisma type issue
    const tickets = await prisma.$queryRaw<any[]>`
      SELECT * FROM "SupportTicket"
      WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Support GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}