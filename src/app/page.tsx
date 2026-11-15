import { getListings } from "@/lib/data";
import { Marketplace } from "@/components/marketplace";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await getListings();
  return <Marketplace listings={listings} />;
}
