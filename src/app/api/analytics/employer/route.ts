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
    where: { employerId: userId },
    include: {
      technician: { include: { technicianProfile: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Count SATISFIED and DISPUTED as completed
  const completedStatuses = ["SATISFIED", "DISPUTED"];

  // Jobs per category
  const categoryMap: Record<string, number> = {};
  jobs.forEach((job) => {
    const cat =
      job.technician.technicianProfile?.serviceCategory || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const jobsByCategory = Object.entries(categoryMap).map(
    ([category, count]) => ({ category, count })
  );

  // Monthly spending — count SATISFIED and DISPUTED
  const now = new Date();
  const monthlySpending = Array.from({ length: 6 }).map((_, i) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - i),
      1
    );
    const month = date.toLocaleString("default", { month: "short" });
    const spent = jobs
      .filter((j) => {
        const d = new Date(j.createdAt);
        return (
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear() &&
          completedStatuses.includes(j.status)
        );
      })
      .reduce((sum, j) => sum + (j.counterPrice || j.offeredPrice), 0);
    return { month, spent };
  });

  const totalSpent = jobs
    .filter((j) => completedStatuses.includes(j.status))
    .reduce((sum, j) => sum + (j.counterPrice || j.offeredPrice), 0);

  const summary = {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === "PENDING").length,
    active: jobs.filter((j) =>
      ["ACCEPTED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS"].includes(
        j.status
      )
    ).length,
    completed: jobs.filter((j) => completedStatuses.includes(j.status))
      .length,
    declined: jobs.filter((j) => j.status === "DECLINED").length,
    totalSpent,
  };

  return NextResponse.json({ jobsByCategory, monthlySpending, summary });
}