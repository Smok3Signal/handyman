import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { sendAccountActionEmail } from "@/lib/resend";

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

// Suspend or unsuspend a user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { action } = await req.json();

    if (action !== "suspend" && action !== "unsuspend") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const suspended = action === "suspend";

    const updated = await prisma.user.update({
      where: { id },
      data: {
        suspended,
        // Pull a suspended technician out of search/availability immediately.
        // Lifting suspension does NOT auto-restore it — they re-toggle themselves.
        ...(suspended ? { isAvailable: false } : {}),
      },
      select: { id: true, suspended: true, isAvailable: true },
    });

    // FIX-03 — admin email on executive action
    if (suspended) {
      await sendAccountActionEmail(
        user.email,
        user.name,
        "Your HandyMan account has been suspended",
        `<p>Your account has been suspended by an administrator. If you believe this is a mistake, please contact support.</p>`
      );
    } else {
      await sendAccountActionEmail(
        user.email,
        user.name,
        "Your HandyMan account has been reinstated",
        `<p>Your account has been reinstated. You can now log in as normal.</p>`
      );
      await prisma.notification.create({
        data: {
          userId: id,
          title: "Account Reinstated",
          message:
            "Your account has been reinstated by an admin. You can log in as normal.",
          type: "ACCOUNT",
          link:
            user.role === "TECHNICIAN"
              ? "/technician/dashboard"
              : "/employer/dashboard",
        },
      });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error("Admin PATCH user error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}

// Permanently delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    // FIX-03 — admin email on executive action (sent after successful delete,
    // using the user object fetched before the row was removed)
    await sendAccountActionEmail(
      user.email,
      user.name,
      "Your HandyMan account has been deleted",
      `<p>Your account and associated data have been permanently deleted by an administrator.</p>`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Foreign-key violation — this user has jobs/messages/reviews/etc attached.
    // Most relations in schema.prisma aren't cascading, so hard-delete only
    // works cleanly for accounts with zero activity. Anything else: suspend.
    if (error?.code === "P2003" || error?.code === "P2014") {
      return NextResponse.json(
        {
          error:
            "This account has existing activity (jobs, messages, or reviews) and can't be permanently deleted. Suspend it instead.",
        },
        { status: 409 }
      );
    }
    console.error("Admin DELETE user error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}