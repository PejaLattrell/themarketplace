import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateMessage, ValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("Please check your message.");
    const message = validateMessage(body);
    const supabase = getSupabase();
    const { data: listing, error: listingError } = await supabase.from("marketplace_listings").select("id").eq("id", message.listing_id).maybeSingle();
    if (listingError) throw listingError;
    if (!listing) return NextResponse.json({ error: "This listing is no longer available." }, { status: 404 });
    const { error } = await supabase.from("marketplace_messages").insert(message);
    if (error) { console.error("Message insert failed:", error.code); throw error; }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof SyntaxError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "We couldn't save your message. Your draft is still here; please try again." }, { status: 500 });
  }
}
