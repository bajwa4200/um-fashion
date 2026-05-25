import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "VENDOR" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No image file" }, { status: 400 });
  }

  const aiForm = new FormData();
  aiForm.append("file", file, "product.jpg");

  try {
    const res = await fetch(`${AI_SERVICE_URL}/products/process-image`, {
      method: "POST",
      body: aiForm,
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Image processing failed. Is the AI service running?" },
        { status: 502 }
      );
    }
    const data = await res.json();
    const dataUrl = `data:${data.contentType};base64,${data.imageBase64}`;
    return NextResponse.json({ success: true, imageUrl: dataUrl });
  } catch {
    return NextResponse.json(
      { error: "Could not reach AI service for image processing" },
      { status: 502 }
    );
  }
}
