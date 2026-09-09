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

// GET /api/admin/support — list all tickets with user info, optional ?status= and ?search=
export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // OPEN | IN_REVIEW | RESOLVED | CLOSED | all
  const search = searchParams.get("search")?.toLowerCase() ?? "";

  try {
    const tickets = await prisma.$queryRaw<any[]>`
      SELECT
        st.*,
        u.name   AS "userName",
        u.email  AS "userEmail",
        u.role   AS "userRole"
      FROM "SupportTicket" st
      LEFT JOIN "User" u ON st."userId" = u.id
      ORDER BY
        CASE st.status
          WHEN 'OPEN'      THEN 1
          WHEN 'IN_REVIEW' THEN 2
          WHEN 'RESOLVED'  THEN 3
          ELSE 4
        END,
        st."createdAt" DESC
    `;

    let filtered = tickets;

    if (status && status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.subject?.toLowerCase().includes(search) ||
          t.message?.toLowerCase().includes(search) ||
          t.userName?.toLowerCase().includes(search) ||
          t.userEmail?.toLowerCase().includes(search) ||
          t.category?.toLowerCase().includes(search)
      );
    }

    const formatted = filtered.map((t) => ({
      id: t.id,
      subject: t.subject,
      message: t.message,
      category: t.category,
      status: t.status,
      adminReply: t.adminReply ?? null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      user: {
        id: t.userId,
        name: t.userName,
        email: t.userEmail,
        role: t.userRole,
      },
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Admin support GET error:", error);
    return NextResponse.json({ error: "Something went wrong", details: String(error) }, { status: 500 });
  }
}