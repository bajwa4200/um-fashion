import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const outfitSession = await prisma.outfitSession.findFirst({
    where: { userId: session.user.id, isComplete: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(outfitSession);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const outfitSession = await prisma.outfitSession.create({
    data: {
      userId: session.user.id,
      occasion: body.occasion,
      location: body.location,
      weatherData: body.weatherData,
      chatHistory: body.chatHistory ?? [],
      currentStep: body.currentStep ?? "PANTS",
    },
  });

  return NextResponse.json(outfitSession);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { sessionId, ...data } = body;

  const outfitSession = await prisma.outfitSession.update({
    where: { id: sessionId, userId: session.user.id },
    data,
  });

  return NextResponse.json(outfitSession);
}
