import { getCommissionRate } from "@/lib/stripe";
import { productToClient } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const commissionRate = await getCommissionRate();

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      vendor: { select: { businessName: true, id: true } },
      reviews: { include: { user: { select: { name: true } } }, take: 10 },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(productToClient(product, commissionRate));
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { vendor: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = product.vendor.userId === session.user.id;
  const isAdmin = session.user.role === "SUPERADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.product.update({
    where: { id },
    data: body,
  });

  const commissionRate = await getCommissionRate();
  return NextResponse.json(productToClient(updated, commissionRate));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { vendor: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = product.vendor.userId === session.user.id;
  const isAdmin = session.user.role === "SUPERADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
