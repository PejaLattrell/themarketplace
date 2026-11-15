import { NextResponse } from "next/server";
import { saveListing } from "@/lib/publish-listing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveListing(body);
    return NextResponse.json(result.id ? { id: result.id } : { error: result.error }, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Send a valid JSON listing." }, { status: 400 });
  }
}
