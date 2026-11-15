import type { Metadata } from "next";
import { CreateListing } from "@/components/create-listing";

export const metadata: Metadata = { title: "Sell a good find", description: "Give your pre-loved pieces a new beginning. Upload a photo and create a free listing, no account needed." };
export default function SellPage() { return <CreateListing />; }
