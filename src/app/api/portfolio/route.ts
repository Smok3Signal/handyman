import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Get portfolio items for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const items = await prisma.portfolioItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

// Add a portfolio item
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, title, description } = await req.json();
  const userId = (session.user as any).id;

  const item = await prisma.portfolioItem.create({
    data: { userId, imageUrl, title, description },
  });

  return NextResponse.json(item, { status: 201 });
}

// Delete a portfolio item
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  await prisma.portfolioItem.delete({ where: { id: id! } });

  return NextResponse.json({ success: true });
}