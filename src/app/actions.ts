"use server";

import { revalidatePath } from "next/cache";
import { saveListing } from "@/lib/publish-listing";

// Publishing is intentionally open to visitors. Database privileges still enforce the allowed operations.
export async function publishListing(body: unknown) {
  const result = await saveListing(body);
  if (result.id) revalidatePath("/");
  return result;
}
