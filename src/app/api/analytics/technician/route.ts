import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const jobs = await prisma.jobRequest.findMany({
    where: { technicianId: userId },
    orderBy: { createdAt: "asc" },
  });

  // Count SATISFIED and DISPUTED as completed for earnings
  const completedStatuses = ["SATISFIED", "DISPUTED"];
  const completed = jobs.filter((j) =>
    completedStatuses.includes(j.status)
  );
  const accepted = jobs.filter((j) =>
    ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS",
     "COMPLETED", "SATISFIED", "DISPUTED"].includes(j.status)
  );

  // Monthly earnings — last 6 months
  const now = new Date();
  const monthlyEarnings = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - i),
      1
    );
    const month = date.toLocaleString("default", { month: "short" });
    const earned = completed
      .filter((j) => {
        const d = new Date(j.createdAt);
        return (
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, j) => sum + (j.counterPrice || j.offeredPrice), 0);
    return { month, earned };
  });

  const totalEarnings = completed.reduce(
    (sum, j) => sum + (j.counterPrice || j.offeredPrice),
    0
  );

  const responded = jobs.filter((j) =>
    ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS",
     "COMPLETED", "SATISFIED", "DISPUTED", "DECLINED"].includes(j.status)
  );

  const acceptanceRate =
    responded.length > 0
      ? Math.round((accepted.length / responded.length) * 100)
      : 0;

  const summary = {
    totalJobs: jobs.length,
    completed: completed.length,
    active: accepted.length,
    pending: jobs.filter((j) => j.status === "PENDING").length,
    totalEarnings,
    acceptanceRate,
    avgJobPrice:
      completed.length > 0
        ? Math.round(totalEarnings / completed.length)
        : 0,
  };

  return NextResponse.json({ monthlyEarnings, summary });
}