"use client";

import { RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <main className="empty-page page-width"><RefreshCw size={38} strokeWidth={1.4} /><div className="eyebrow">A SMALL BUMP IN THE ROAD</div><h1>Let’s try that again.</h1><p>We couldn’t connect to the marketplace right now.<br />Your next good find will be worth the wait.</p><button className="button button-green" onClick={reset}><RefreshCw size={16} />Try again</button></main>; }
