import { auth } from "@/lib/auth";
import { aiChatStream } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();
  const stream = await aiChatStream(messages);

  if (!stream) {
    const { aiChat } = await import("@/lib/ai");
    const result = await aiChat(messages);
    return NextResponse.json({ reply: result.reply, stream: false });
  }

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
