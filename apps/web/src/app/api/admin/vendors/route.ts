import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vendors = await prisma.vendor.findMany({
    include: { user: { select: { email: true, name: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vendors);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { vendorId, status } = await req.json();
  const vendor = await prisma.vendor.update({
    where: { id: vendorId },
    data: { status },
  });

  if (status === "APPROVED") {
    await prisma.user.update({
      where: { id: vendor.userId },
      data: { role: "VENDOR" },
    });
  }

  return NextResponse.json(vendor);
}
