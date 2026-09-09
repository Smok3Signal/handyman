import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      employer: { select: { id: true, name: true, latitude: true, longitude: true } },
      technician: { select: { id: true, name: true, latitude: true, longitude: true } },
      messages: { include: { sender: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      review: true,
      dispute: true,
    },
  });

  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    status,
    counterPrice,
    redoReason,
    techLat,
    techLng,
    proximityAlert,
    arrivedImages,
    completedImages,
    autoPortfolio,
  } = body;

  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      employer: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Proximity alert ────────────────────────────────────────────────────────
  if (proximityAlert) {
    const updateData: any = {};
    if (techLat !== undefined) updateData.technicianLat = techLat;
    if (techLng !== undefined) updateData.technicianLng = techLng;

    await prisma.jobRequest.update({ where: { id }, data: updateData });

    await prisma.notification.create({
      data: {
        userId: job.employerId,
        title: "Technician Nearby",
        message: `${job.technician.name} is less than 1 km away and will arrive shortly.`,
        type: "JOB_UPDATE",
        link: `/employer/ongoing`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: job.technicianId,
        title: "Almost There",
        message: `You are close to ${job.employer.name}'s location.`,
        type: "JOB_UPDATE",
        link: `/technician/jobs`,
      },
    });

    return NextResponse.json({ success: true });
  }

  // ── Build update payload ───────────────────────────────────────────────────
  const updateData: any = {};
  if (status) updateData.status = status;
  if (counterPrice !== undefined) updateData.counterPrice = counterPrice;
  if (redoReason !== undefined) updateData.redoReason = redoReason;
  if (techLat !== undefined) updateData.technicianLat = techLat;
  if (techLng !== undefined) updateData.technicianLng = techLng;
  if (arrivedImages !== undefined) updateData.arrivedImages = arrivedImages;
  if (completedImages !== undefined) updateData.completedImages = completedImages;
  if (status === "ARRIVED") updateData.arrivedAt = new Date();
  if (status === "SATISFIED") updateData.satisfiedAt = new Date();

  const updatedJob = await prisma.jobRequest.update({ where: { id }, data: updateData });

  // ── Auto-create portfolio items from completed photos ─────────────────────
  if (autoPortfolio && completedImages && completedImages.length > 0) {
    const portfolioEntries = completedImages.map((imgUrl: string, idx: number) => ({
      userId: job.technicianId,
      imageUrl: imgUrl,
      title: `Completed Job${completedImages.length > 1 ? ` (${idx + 1}/${completedImages.length})` : ""}`,
      description: job.description,
      jobRequestId: job.id,
      isCompletedJob: true,
    }));
    await prisma.portfolioItem.createMany({ data: portfolioEntries });
  }

  // ── Notifications by status ────────────────────────────────────────────────
  const notifs: { userId: string; title: string; message: string; type: string; link: string }[] = [];

  if (status === "ON_THE_WAY") {
    notifs.push({
      userId: job.employerId,
      title: "Technician On The Way",
      message: `${job.technician.name} is heading to your location.`,
      type: "JOB_UPDATE",
      link: `/employer/ongoing`,
    });
  }
  if (status === "ARRIVED") {
    notifs.push({
      userId: job.employerId,
      title: "Technician Arrived",
      message: `${job.technician.name} has arrived at your location.`,
      type: "JOB_UPDATE",
      link: `/employer/ongoing`,
    });
  }
  if (status === "COMPLETED") {
    notifs.push({
      userId: job.employerId,
      title: "Job Marked Complete",
      message: `${job.technician.name} has marked the job as complete. Please confirm or request a redo.`,
      type: "JOB_UPDATE",
      link: `/employer/ongoing`,
    });
  }
  if (status === "COUNTERED") {
    notifs.push({
      userId: job.employerId,
      title: "Counter Offer Received",
      message: `${job.technician.name} has sent a counter offer of ₦${counterPrice?.toLocaleString()}.`,
      type: "COUNTER_OFFER",
      link: `/employer/jobs`,
    });
  }
  if (status === "ACCEPTED") {
    notifs.push({
      userId: job.employerId,
      title: "Job Accepted",
      message: `${job.technician.name} has accepted your job request.`,
      type: "JOB_UPDATE",
      link: `/employer/jobs`,
    });
  }
  if (status === "DECLINED") {
    notifs.push({
      userId: job.employerId,
      title: "Job Declined",
      message: `${job.technician.name} has declined your job request.`,
      type: "JOB_UPDATE",
      link: `/employer/jobs`,
    });
  }
  if (status === "REDO_REQUESTED") {
    notifs.push({
      userId: job.employerId,
      title: "Redo Requested",
      message: `${job.technician.name} has flagged a redo issue: ${redoReason ?? ""}`,
      type: "JOB_UPDATE",
      link: `/employer/ongoing`,
    });
  }
  if (status === "CANCELLED") {
    notifs.push({
      userId: job.employerId,
      title: "Job Cancelled",
      message: `${job.technician.name} has cancelled the accepted job. You can find another technician.`,
      type: "JOB_UPDATE",
      link: `/employer/jobs`,
    });
  }

  if (notifs.length > 0) {
    await prisma.notification.createMany({ data: notifs });
  }

  return NextResponse.json(updatedJob);
}