import { getSupabase } from "./supabase";
import { PUBLIC_LISTING_COLUMNS, type Listing } from "./marketplace";

export async function getListings(): Promise<Listing[]> {
  const { data, error } = await getSupabase().from("marketplace_listings").select(PUBLIC_LISTING_COLUMNS).order("created_at", { ascending: false });
  if (error) { console.error("Listing fetch failed:", error.code); throw new Error("We couldn't load the latest finds. Please try again."); }
  return data as unknown as Listing[];
}

export async function getListing(id: string): Promise<Listing | null> {
  const { data, error } = await getSupabase().from("marketplace_listings").select(PUBLIC_LISTING_COLUMNS).eq("id", id).maybeSingle();
  if (error) { console.error("Listing fetch failed:", error.code); throw new Error("We couldn't load this listing. Please try again."); }
  return data as unknown as Listing | null;
}
