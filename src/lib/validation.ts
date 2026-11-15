import { CATEGORIES, CONDITIONS } from "./marketplace.ts";

export class ValidationError extends Error {}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stringValue(data: Record<string, unknown>, key: string, label: string, min: number, max: number) {
  const value = typeof data[key] === "string" ? data[key].trim() : "";
  if (value.length < min || value.length > max) throw new ValidationError(`${label} must be ${min}–${max} characters.`);
  return value;
}

export function validateListing(data: Record<string, unknown>) {
  const title = stringValue(data, "title", "Title", 3, 120);
  const description = stringValue(data, "description", "Description", 20, 5000);
  const seller_email = stringValue(data, "seller_email", "Email", 3, 254).toLowerCase();
  if (!EMAIL.test(seller_email)) throw new ValidationError("Enter a valid email address.");
  const rawPrice = data.price;
  if ((typeof rawPrice !== "string" && typeof rawPrice !== "number") || String(rawPrice).trim() === "") throw new ValidationError("Enter a price. Use 0 for a free item.");
  const price = Number(rawPrice);
  if (!Number.isFinite(price) || price < 0 || price > 10000000 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) throw new ValidationError("Price must be between $0 and $10,000,000 with up to two decimal places.");
  if (!CATEGORIES.includes(data.category as typeof CATEGORIES[number])) throw new ValidationError("Choose a category.");
  const condition = data.condition || "Good";
  if (!CONDITIONS.includes(condition as typeof CONDITIONS[number])) throw new ValidationError("Choose the item's condition.");
  const seller_name = stringValue({ ...data, seller_name: typeof data.seller_name === "string" && data.seller_name.trim() ? data.seller_name : "Community seller" }, "seller_name", "Your name", 2, 60);
  const location = stringValue({ ...data, location: typeof data.location === "string" && data.location.trim() ? data.location : "Local pickup" }, "location", "Location", 2, 100);
  const image_path = stringValue(data, "image_path", "Photo", 1, 200);
  if (!/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/.test(image_path) || !UUID.test(image_path.split(".")[0])) throw new ValidationError("Upload a photo before publishing.");
  return { title, description, seller_email, price, category: data.category as typeof CATEGORIES[number], condition: condition as typeof CONDITIONS[number], seller_name, location, image_path };
}

export function validateMessage(data: Record<string, unknown>) {
  const listing_id = stringValue(data, "listing_id", "Listing", 36, 36);
  if (!UUID.test(listing_id)) throw new ValidationError("This listing is not valid.");
  const buyer_name = stringValue(data, "buyer_name", "Your name", 2, 60);
  const buyer_email = stringValue(data, "buyer_email", "Email", 3, 254).toLowerCase();
  if (!EMAIL.test(buyer_email)) throw new ValidationError("Enter a valid email address.");
  const body = stringValue(data, "body", "Message", 10, 2000);
  return { listing_id, buyer_name, buyer_email, body };
}
