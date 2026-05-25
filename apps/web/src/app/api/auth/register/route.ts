import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { slugify } from "@um/shared";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["USER", "VENDOR"]).default("USER"),
  businessName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        ...(data.role === "VENDOR" && data.businessName
          ? {
              vendor: {
                create: {
                  businessName: data.businessName,
                  slug: slugify(data.businessName),
                  status: "PENDING",
                },
              },
            }
          : {}),
      },
      include: { vendor: true },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      vendorStatus: user.vendor?.status,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
