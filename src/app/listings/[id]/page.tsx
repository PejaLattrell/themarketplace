import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, MapPin, CalendarDays, Leaf, ShieldCheck, Info, Tag } from "lucide-react";
import { getListing, getListings } from "@/lib/data";
import { UUID } from "@/lib/validation";
import { formatPrice, photoUrl, relativeDate } from "@/lib/marketplace";
import { ProductImage } from "@/components/product-image";
import { ListingCard, SaveButton } from "@/components/listing-card";
import { MessageSeller } from "@/components/message-seller";
import { ShareButton } from "@/components/share-button";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Listing not found" };
  const listing = await getListing(id);
  return listing ? { title: listing.title, description: listing.description.slice(0, 160), openGraph: { title: listing.title, images: [photoUrl(listing.image_path)] } } : { title: "Listing not found" };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const listing = await getListing(id);
  if (!listing) notFound();
  const all = await getListings();
  const related = all.filter(item => item.id !== id).sort((a, b) => Number(b.category === listing.category) - Number(a.category === listing.category)).slice(0, 4);
  return <main className="detail-page page-width"><div className="detail-topline"><Link href="/#browse" className="back-link"><ArrowLeft size={16} />Back to the finds</Link><ShareButton title={listing.title} /></div><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Discover</Link><ChevronRight size={13} /><span>{listing.category}</span><ChevronRight size={13} /><span>{listing.title}</span></nav><div className="detail-layout"><div><div className="detail-photo"><ProductImage src={photoUrl(listing.image_path)} alt={listing.title} priority /><span className="photo-count">1 / 1</span></div><div className="description-block"><div className="eyebrow">A LITTLE MORE ABOUT THIS FIND</div><h2>Every piece has a story.</h2><p className="listing-description">{listing.description}</p><div className="detail-facts"><div><Tag size={19} /><div><span>Category</span><strong>{listing.category}</strong></div></div><div><ShieldCheck size={19} /><div><span>Condition</span><strong>{listing.condition}</strong></div></div></div></div></div><aside className="detail-summary"><div className="detail-tags"><span className="category-tag">{listing.category}</span><SaveButton id={id} large /></div><h1>{listing.title}</h1><div className="detail-price">{formatPrice(Number(listing.price))}<span>USD</span></div><div className="detail-location"><MapPin size={16} />{listing.location}<span>·</span><CalendarDays size={15} />{relativeDate(listing.created_at)}</div>{listing.is_demo && <div className="demo-note"><Info size={17} /><span>This is a sample listing for exploring Good Finds. This item isn’t for sale.</span></div>}<div className="seller-block"><span className="seller-avatar">{listing.seller_name.charAt(0).toUpperCase()}</span><div><span>MEET THE SELLER</span><strong>{listing.seller_name}</strong></div><span className="seller-dot" aria-hidden="true">✳</span></div><MessageSeller listingId={id} sellerName={listing.seller_name} title={listing.title} demo={listing.is_demo} /><div className="safe-note"><ShieldCheck size={19} /><div><h3>A little care goes a long way.</h3><p>Arrange pickup in a public place. See the item before paying, and never share sensitive information.</p></div></div><div className="detail-good-note"><Leaf size={20} /><p>Pre-loved. Full of possibility.</p></div></aside></div>{related.length > 0 && <section className="related-section"><div className="section-heading"><div><div className="eyebrow">THERE’S MORE GOOD TO GO AROUND</div><h2>A few more you might love.</h2></div><Link href="/#browse" className="text-button">Explore all finds <ArrowRight size={16} /></Link></div><div className="listing-grid">{related.map(item => <ListingCard key={item.id} listing={item} />)}</div></section>}</main>;
}
