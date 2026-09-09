import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Use raw query to bypass Prisma type checking issue
    const users = await prisma.$queryRaw<{ isAvailable: boolean }[]>`
      SELECT "isAvailable" FROM "User" WHERE id = ${userId}
    `;

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentValue = users[0].isAvailable;
    const newValue = !currentValue;

    // Update using raw query
    await prisma.$executeRaw`
      UPDATE "User" SET "isAvailable" = ${newValue} WHERE id = ${userId}
    `;

    return NextResponse.json({ isAvailable: newValue });
  } catch (error) {
    console.error("Toggle availability error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}