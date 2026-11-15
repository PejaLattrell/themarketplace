import { getSupabase } from "./supabase";
import { validateListing, ValidationError } from "./validation";
import { MAX_PHOTO_SIZE, PHOTO_TYPES } from "./marketplace";

export async function saveListing(body: unknown): Promise<{ id?: string; error?: string; status: number }> {
  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("Please check your listing details.");
    const listing = validateListing(body as Record<string, unknown>);
    const supabase = getSupabase();
    // Only fetch a validated UUID path from our own public image bucket.
    const { data: { publicUrl } } = supabase.storage.from("marketplace-images").getPublicUrl(listing.image_path);
    const photo = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    if (!photo.ok || !PHOTO_TYPES.includes((photo.headers.get("content-type") || "").split(";")[0]) || Number(photo.headers.get("content-length")) > MAX_PHOTO_SIZE) throw new ValidationError("The photo hasn't finished uploading. Please select it again.");
    const { data, error } = await supabase.from("marketplace_listings").insert(listing).select("id").single();
    if (error) {
      console.error("Create listing failed:", error.code);
      return { error: "We couldn't publish your listing. Your details are still here; please try again.", status: 500 };
    }
    return { id: data.id, status: 201 };
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message, status: 400 };
    console.error("Create listing request failed");
    return { error: "Something went wrong. Please try publishing again.", status: 500 };
  }
}
