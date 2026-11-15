"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [state, setState] = useState("");
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setState("Link copied"); setTimeout(() => setState(""), 3000); }
    } catch (error) { if (error instanceof Error && error.name !== "AbortError") setState("Copy the page URL to share"); }
  }
  return <button className="share-button" onClick={share} aria-label="Share listing">{state === "Link copied" ? <Check size={18} /> : <Share2 size={18} />}<span role="status">{state || "Share"}</span></button>;
}
