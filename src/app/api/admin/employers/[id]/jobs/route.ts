import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.NEXTAUTH_SECRET!));
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const employer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      suspended: true,
      createdAt: true,
    },
  });

  if (!employer)
    return NextResponse.json({ error: "Employer not found" }, { status: 404 });

  const jobs = await prisma.jobRequest.findMany({
    where: { employerId: id },
    orderBy: { createdAt: "desc" },
    include: {
      technician: {
        select: {
          id: true,
          name: true,
          email: true,
          technicianProfile: {
            select: { businessName: true, serviceCategory: true, averageRating: true },
          },
        },
      },
    },
  });

  const summary = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "PENDING").length,
    active: jobs.filter((j) =>
      ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "REDO_REQUESTED"].includes(j.status)
    ).length,
    completed: jobs.filter((j) =>
      ["COMPLETED", "SATISFIED"].includes(j.status)
    ).length,
    disputed: jobs.filter((j) => j.status === "DISPUTED").length,
    cancelled: jobs.filter((j) => j.status === "CANCELLED").length,
    totalSpend: jobs
      .filter((j) => ["COMPLETED", "SATISFIED"].includes(j.status))
      .reduce((sum, j) => sum + (j.offeredPrice ?? 0), 0),
  };

  return NextResponse.json({ employer, jobs, summary });
}