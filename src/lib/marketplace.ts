export const CATEGORIES = ["Furniture", "Electronics", "Fashion", "Home & Living", "Books & Hobbies", "Sports & Outdoors", "Other"] as const;
export type Category = typeof CATEGORIES[number];
export const CONDITIONS = ["New", "Like new", "Good", "Well loved"] as const;
export const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PUBLIC_LISTING_COLUMNS = "id,title,description,price,category,image_path,seller_name,location,condition,is_demo,created_at";

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  image_path: string;
  seller_name: string;
  location: string;
  condition: typeof CONDITIONS[number];
  is_demo: boolean;
  created_at: string;
};

export function formatPrice(price: number) {
  return price === 0 ? "Free" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Number.isInteger(price) ? 0 : 2 }).format(price);
}

export function relativeDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function photoUrl(path: string) {
  if (path.startsWith("https://images.unsplash.com/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/marketplace-images/${path}`;
}
