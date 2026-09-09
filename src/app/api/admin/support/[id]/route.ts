import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "admin-secret-key");
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

const VALID_STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

// PATCH /api/admin/support/[id]
// Body: { status?: string, adminReply?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, adminReply } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!status && adminReply === undefined) {
    return NextResponse.json({ error: "Provide status, adminReply, or both" }, { status: 400 });
  }

  try {
    // Build update fields dynamically
    const now = new Date().toISOString();

    if (status && adminReply !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SupportTicket"
        SET status = ${status}, "adminReply" = ${adminReply}, "updatedAt" = ${now}::timestamp
        WHERE id = ${id}
      `;
    } else if (status) {
      await prisma.$executeRaw`
        UPDATE "SupportTicket"
        SET status = ${status}, "updatedAt" = ${now}::timestamp
        WHERE id = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "SupportTicket"
        SET "adminReply" = ${adminReply}, "updatedAt" = ${now}::timestamp
        WHERE id = ${id}
      `;
    }

    // Fetch updated ticket + user info to return
    const rows = await prisma.$queryRaw<any[]>`
      SELECT st.*, u.name AS "userName", u.email AS "userEmail"
      FROM "SupportTicket" st
      LEFT JOIN "User" u ON st."userId" = u.id
      WHERE st.id = ${id}
    `;

    if (!rows.length) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const t = rows[0];

    // Notify user if a reply was added
    if (adminReply !== undefined && adminReply.trim()) {
      await prisma.notification.create({
        data: {
          userId: t.userId,
          title: "Support Ticket Updated",
          message: `Admin has replied to your ticket: "${t.subject}". Check your support page for their response.`,
          type: "MESSAGE",
          link: "/support",
        },
      });
    }

    return NextResponse.json({
      id: t.id,
      subject: t.subject,
      status: t.status,
      adminReply: t.adminReply ?? null,
      updatedAt: t.updatedAt,
      user: { id: t.userId, name: t.userName, email: t.userEmail },
    });
  } catch (error) {
    console.error("Admin support PATCH error:", error);
    return NextResponse.json({ error: "Something went wrong", details: String(error) }, { status: 500 });
  }
}