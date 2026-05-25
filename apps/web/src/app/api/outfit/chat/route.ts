import { auth } from "@/lib/auth";
import { aiChat } from "@/lib/ai";
import { NextResponse } from "next/server";

function fallbackReply(messages: { role: string; content: string }[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const lower = lastUser.toLowerCase();
  if (/wedding|formal|party|date/.test(lower)) {
    return "Special occasion vibes! Tell me your city and I'll pick the perfect fit for you twin.";
  }
  if (/gym|workout|sport|run/.test(lower)) {
    return "Active energy! What city are you in? I'll find performance wear that slaps.";
  }
  if (/office|work|meeting|interview/.test(lower)) {
    return "Professional drip incoming. Where's this happening? I'll match the weather too.";
  }
  return "Hey twin! Your 3D avatar is ready. Where are you headed and what city?";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();
  try {
    const result = await aiChat(messages);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ reply: fallbackReply(messages) });
  }
}
