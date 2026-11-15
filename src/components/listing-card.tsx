"use client";

import Link from "next/link";
import { Heart, MapPin, ArrowUpRight } from "lucide-react";
import { type Listing, formatPrice, photoUrl, relativeDate } from "@/lib/marketplace";
import { useSaved } from "./saved-provider";
import { ProductImage } from "./product-image";

export function SaveButton({ id, large = false }: { id: string; large?: boolean }) {
  const { saved, toggle } = useSaved();
  const active = saved.includes(id);
  return <button type="button" className={`save-button ${active ? "is-saved" : ""} ${large ? "save-large" : ""}`} onClick={() => toggle(id)} aria-label={active ? "Remove from saved items" : "Save item"} aria-pressed={active}><Heart size={large ? 21 : 18} fill={active ? "currentColor" : "none"} />{large && <span>{active ? "Saved" : "Save item"}</span>}</button>;
}

export function ListingCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  return <article className="listing-card" data-category={listing.category}><div className="card-photo"><Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`} tabIndex={-1}><ProductImage src={photoUrl(listing.image_path)} alt={listing.title} priority={priority} /></Link><span className={`condition-tag ${listing.condition === "Like new" ? "condition-green" : ""}`}>{listing.condition}</span><SaveButton id={listing.id} /></div><div className="card-content"><div className="card-category">{listing.category}{listing.is_demo && <span> · Sample</span>}</div><Link href={`/listings/${listing.id}`} className="card-title">{listing.title}<ArrowUpRight size={16} /></Link><div className="card-price">{formatPrice(Number(listing.price))}</div><div className="card-meta"><span><MapPin size={13} />{listing.location}</span><span>{relativeDate(listing.created_at)}</span></div></div></article>;
}
