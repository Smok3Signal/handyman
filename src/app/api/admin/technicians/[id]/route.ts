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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const profile = await prisma.technicianProfile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // ── Manually adjust star rating ──────────────────────────────────────────
    if (action === "adjust_rating") {
      const { rating } = body;
      if (typeof rating !== "number" || rating < 0 || rating > 5) {
        return NextResponse.json(
          { error: "Rating must be a number between 0 and 5" },
          { status: 400 }
        );
      }

      const updated = await prisma.technicianProfile.update({
        where: { userId: id },
        data: { averageRating: rating },
      });

      await prisma.notification.create({
        data: {
          userId: id,
          title: "Rating Updated",
          message: `Your rating has been adjusted to ${rating.toFixed(1)} stars by an admin.`,
          type: "ACCOUNT",
          link: "/technician/dashboard",
        },
      });

      return NextResponse.json({ success: true, profile: updated });
    }

    // ── Grant / revoke Top Performer badge ───────────────────────────────────
    if (action === "toggle_badge") {
      const grant = !(profile as any).isTopPerformer;

      const updated = await prisma.technicianProfile.update({
        where: { userId: id },
        data: { isTopPerformer: grant } as any,
      });

      await prisma.notification.create({
        data: {
          userId: id,
          title: grant ? "Top Performer Badge Granted 🏆" : "Top Performer Badge Removed",
          message: grant
            ? "Congratulations! An admin has granted you the Top Performer badge."
            : "Your Top Performer badge has been removed by an admin.",
          type: "ACCOUNT",
          link: "/technician/dashboard",
        },
      });

      return NextResponse.json({ success: true, profile: updated });
    }

    // ── Force technician offline ─────────────────────────────────────────────
    if (action === "force_offline") {
      await prisma.user.update({
        where: { id },
        data: { isAvailable: false },
      });

      await prisma.notification.create({
        data: {
          userId: id,
          title: "Availability Disabled",
          message:
            "An admin has set your availability to offline. You will not appear in search results until you re-enable availability from your dashboard.",
          type: "ACCOUNT",
          link: "/technician/dashboard",
        },
      });

      return NextResponse.json({ success: true });
    }

    // ── Remove a portfolio item ──────────────────────────────────────────────
    if (action === "remove_portfolio_item") {
      const { portfolioItemId } = body;
      if (!portfolioItemId) {
        return NextResponse.json(
          { error: "portfolioItemId is required" },
          { status: 400 }
        );
      }

      // PortfolioItem.userId is the owner — verify it matches this technician
      const item = await prisma.portfolioItem.findUnique({
        where: { id: portfolioItemId },
      });

      if (!item || item.userId !== id) {
        return NextResponse.json(
          { error: "Portfolio item not found or does not belong to this technician" },
          { status: 404 }
        );
      }

      await prisma.portfolioItem.delete({ where: { id: portfolioItemId } });

      await prisma.notification.create({
        data: {
          userId: id,
          title: "Portfolio Item Removed",
          message:
            "An admin has removed one of your portfolio items. If you believe this was a mistake, please contact support.",
          type: "ACCOUNT",
          link: "/technician/portfolio",
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin PATCH technician error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}

// GET single technician — full profile + portfolio for the admin detail view
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        role: true,
        suspended: true,
        isAvailable: true,
        createdAt: true,
        technicianProfile: true,       // full profile including isTopPerformer once schema updated
        portfolioItems: {              // relation lives on User directly
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            jobRequestsAsTechnician: true,
          },
        },
      },
    });

    if (!user || user.role !== "TECHNICIAN") {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Admin GET technician error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}