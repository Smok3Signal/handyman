import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const jobRequestId = searchParams.get("jobRequestId");
    if (!jobRequestId) {
      return NextResponse.json({ error: "jobRequestId required" }, { status: 400 });
    }
    const messages = await prisma.message.findMany({
      where: { jobRequestId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { jobRequestId, content } = body;
    const senderId = (session.user as any).id;
    const senderName = (session.user as any).name;
    if (!jobRequestId || !content?.trim()) {
      return NextResponse.json({ error: "jobRequestId and content are required" }, { status: 400 });
    }
    const job = await prisma.jobRequest.findUnique({
      where: { id: jobRequestId },
      include: {
        employer: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const message = await prisma.message.create({
      data: { jobRequestId, senderId, content: content.trim() },
      include: { sender: { select: { id: true, name: true } } },
    });
    try {
      const isEmployer = senderId === job.employerId;
      const recipientId = isEmployer ? job.technicianId : job.employerId;
      // FIX-08: employer recipients were always sent to /employer/ongoing,
      // even for a still-PENDING job (no "ongoing" job to show there yet).
      // Route by job status instead. Technician side unaffected — there's
      // no separate "ongoing" page for technicians, /technician/jobs covers
      // all statuses.
      const link = isEmployer
        ? "/technician/jobs"
        : job.status === "PENDING"
          ? "/employer/jobs"
          : "/employer/ongoing";
      const preview = content.trim().length > 60 ? content.trim().slice(0, 60) + "..." : content.trim();
      await prisma.notification.create({
        data: {
          userId: recipientId,
          title: `New Message from ${senderName} 💬`,
          message: preview,
          type: "MESSAGE",
          link,
        },
      });
    } catch (notifError) {
      console.error("Message notification failed:", notifError);
    }
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Something went wrong", details: String(error) }, { status: 500 });
  }
}