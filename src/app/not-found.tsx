import Link from "next/link";
import { ArrowLeft, PackageSearch } from "lucide-react";

export default function NotFound() { return <main className="empty-page page-width"><PackageSearch size={45} strokeWidth={1.2} /><div className="eyebrow">THIS ONE GOT AWAY</div><h1>That find isn’t here.</h1><p>The link may be incorrect, or this listing is no longer available.<br />There are plenty more good things to discover.</p><Link href="/#browse" className="button button-green"><ArrowLeft size={17} />Back to the finds</Link></main>; }
