"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Plus, ArrowUpRight } from "lucide-react";
import { useSaved } from "./saved-provider";

export function Brand() {
  return <Link href="/" className="brand" aria-label="Good Finds home"><svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 3C26 3 24 12 24 12S32 7 35 13C38 19 29 21 29 21S38 25 33 31C29 36 23 29 23 29S25 39 18 37C11 36 16 27 16 27S7 32 4 26C1 20 11 18 11 18S3 12 8 7C13 2 17 12 17 12S14 3 20 3Z" fill="currentColor"/><circle cx="20" cy="20" r="4" fill="#FBFAF6"/></svg><span>good finds<span className="brand-period">.</span></span></Link>;
}

export function Header() {
  const path = usePathname();
  const { saved } = useSaved();
  return <><div className="announcement">A little less new. A lot more possibility. <span>Find your next good thing <ArrowUpRight size={13} /></span></div><header className="site-header"><div className="header-inner"><Brand /><nav aria-label="Main navigation"><Link href="/" className={path === "/" ? "nav-active" : ""}>Discover</Link><Link href="/#how-it-works" className="how-nav">How it works</Link></nav><div className="header-actions"><Link href="/?saved=1#browse" className="saved-nav" aria-label={`Saved items (${saved.length})`}><Heart size={19} /><span>Saved{saved.length > 0 && <b>{saved.length}</b>}</span></Link><Link href="/sell" className="button button-green header-sell"><Plus size={17} /><span>Sell an item</span></Link></div></div></header></>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-top"><Brand /><p>Good things deserve another chapter.</p><Link href="/sell">Pass something good along <ArrowUpRight size={16} /></Link></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Good Finds. Made for a second life.</span><span>Less waste. More good finds. <span aria-hidden="true">✳</span></span></div></footer>;
}
