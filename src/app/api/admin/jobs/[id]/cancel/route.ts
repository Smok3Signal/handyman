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

const CANCELLABLE = [
  "PENDING", "ACCEPTED", "COUNTERED", "EMPLOYER_COUNTERED",
  "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "REDO_REQUESTED",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json().catch(() => ({ reason: "" }));

  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      employer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
  });

  if (!job)
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  if (!CANCELLABLE.includes(job.status))
    return NextResponse.json(
      { error: `Cannot cancel a job with status ${job.status}` },
      { status: 400 }
    );

  const updated = await prisma.jobRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Notify both parties
  const note = reason
    ? `Your job has been cancelled by an admin. Reason: ${reason}`
    : "Your job has been cancelled by an admin.";

  await prisma.notification.createMany({
  data: [
    {
      userId: job.employer.id,
      title: "Job Cancelled",
      type: "JOB_UPDATE",
      message: note,
      link: "/employer/jobs",
    },
    {
      userId: job.technician.id,
      title: "Job Cancelled",
      type: "JOB_UPDATE",
      message: note,
      link: "/technician/jobs",
    },
  ],
});

  return NextResponse.json({ success: true, job: updated });
}