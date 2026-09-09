import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Create a job request
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { technicianId, description, offeredPrice } =
      await req.json();
    const employerId = (session.user as any).id;

    // Get employer details
    const employer = await prisma.user.findUnique({
      where: { id: employerId },
      select: { id: true, name: true },
    });

    if (!employer) {
      return NextResponse.json(
        { error: "Employer not found" },
        { status: 404 }
      );
    }

    // Check if employer is a serial disputer
    const totalJobs = await prisma.jobRequest.count({
      where: { employerId },
    });

    const totalDisputes = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as count FROM "Dispute" WHERE "employerId" = $1`,
      employerId
    );

    const disputeCount = Number(totalDisputes[0]?.count || 0);
    const isSerialDisputer = totalJobs < 10 && disputeCount >= 5;

    // Create the job
    const job = await prisma.jobRequest.create({
      data: {
        employerId,
        technicianId,
        description,
        offeredPrice: parseFloat(offeredPrice),
      },
      include: {
        employer: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
      },
    });

    // Notify technician about new job
    await prisma.notification.create({
      data: {
        userId: technicianId,
        title: "New Job Request! 🔧",
        message: `${employer.name} sent you a job request with an offer of ₦${parseFloat(
          offeredPrice
        ).toLocaleString()}.`,
        type: "JOB_REQUEST",
        link: "/technician/jobs",
      },
    });

    // If serial disputer send additional warning
    if (isSerialDisputer) {
      await prisma.notification.create({
        data: {
          userId: technicianId,
          title: "⚠️ Employer Dispute Warning",
          message: `Be careful! ${employer.name} has filed ${disputeCount} disputes in fewer than ${totalJobs} jobs. Document your work thoroughly with photos and take extra care to meet their expectations.`,
          type: "JOB_REQUEST",
          link: "/technician/jobs",
        },
      });
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Jobs POST error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Get jobs for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const jobs = await prisma.jobRequest.findMany({
      where:
        role === "EMPLOYER"
          ? { employerId: userId }
          : { technicianId: userId },
      include: {
        employer: {
          select: {
            id: true,
            name: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            phone: true,
            latitude: true,
            longitude: true,
            technicianProfile: true,
          },
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        review: true,
        dispute: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Add serial disputer flag to each job
    const jobsWithFlags = await Promise.all(
      jobs.map(async (job) => {
        try {
          const totalEmployerJobs = await prisma.jobRequest.count({
            where: { employerId: job.employerId },
          });

          const employerDisputes =
            await prisma.$queryRawUnsafe<any[]>(
              `SELECT COUNT(*) as count FROM "Dispute" WHERE "employerId" = $1`,
              job.employerId
            );

          const disputeCount = Number(
            employerDisputes[0]?.count || 0
          );

          return {
            ...job,
            isSerialDisputer:
              totalEmployerJobs < 10 && disputeCount >= 5,
          };
        } catch {
          return { ...job, isSerialDisputer: false };
        }
      })
    );

    return NextResponse.json(jobsWithFlags);
  } catch (error) {
    console.error("Jobs GET error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: String(error) },
      { status: 500 }
    );
  }
}