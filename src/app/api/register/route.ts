import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, password, phone, role,
      latitude, longitude, address,
      // Technician fields
      businessName, serviceCategory,
      yearsOfExperience, basePrice, description,
    } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        // If technician, create their profile too
        ...(role === "TECHNICIAN" && {
          technicianProfile: {
            create: {
              businessName,
              serviceCategory,
              yearsOfExperience: parseInt(yearsOfExperience),
              basePrice: parseFloat(basePrice),
              description,
            },
          },
        }),
      },
    });

    // FIX-02 — email verification
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });
    await sendVerificationEmail(email, name, token);

    return NextResponse.json({ message: "User created", userId: user.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}