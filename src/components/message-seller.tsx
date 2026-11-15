"use client";

import { useRef, useState, type FormEvent } from "react";
import { Check, MessageCircle, Send, ShieldCheck, LoaderCircle, AlertCircle } from "lucide-react";

export function MessageSeller({ listingId, sellerName, title, demo }: { listingId: string; sellerName: string; title: string; demo: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(`Hi! Is your ${title} still available?`);
  const firstInput = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listing_id: listingId, ...Object.fromEntries(form), body: message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "We couldn't save your message. Please try again.");
      setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Please check your connection and try again."); }
    finally { setBusy(false); }
  }
  if (sent) return <div className="message-success" role="status"><span><Check size={26} /></span><h3>Your message is saved.</h3><p>{demo ? "This is a sample listing, so no seller will reply. Your message was saved successfully." : `Thanks for reaching out to ${sellerName}. Your message and reply email have been saved privately for the seller.`}</p><p className="message-success-note">Email notifications are not enabled.</p></div>;
  return <div className="message-seller"><button type="button" className="button button-green message-open" onClick={() => { setOpen(!open); if (!open) setTimeout(() => firstInput.current?.focus(), 50); }} aria-expanded={open} aria-controls="seller-message-form"><MessageCircle size={19} />{open ? "Write your message" : "Message seller"}</button>{!open && <p className="contact-note">A good connection starts with hello.</p>}{open && <form id="seller-message-form" onSubmit={submit} className="message-form"><p>Say hello to <strong>{sellerName}</strong> about this find.</p>{demo && <div className="demo-note">Sample listing: messages are saved, but this item isn’t for sale.</div>}<div className="field"><label htmlFor="buyer_name">Your name</label><input ref={firstInput} id="buyer_name" name="buyer_name" autoComplete="given-name" minLength={2} maxLength={60} placeholder="First name" required disabled={busy} /></div><div className="field"><label htmlFor="buyer_email">Your email</label><input id="buyer_email" name="buyer_email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required disabled={busy} /><p className="field-hint">So the seller knows how to reach you.</p></div><div className="field"><label htmlFor="body">Your message</label><textarea id="body" name="body" minLength={10} maxLength={2000} rows={4} value={message} onChange={event => setMessage(event.target.value)} required disabled={busy} /></div>{error && <div className="form-error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}<button type="submit" className="button button-green send-message" disabled={busy}>{busy ? <><LoaderCircle size={17} className="spin" />Saving message…</> : <>Send message <Send size={16} /></>}</button><p className="message-privacy"><ShieldCheck size={14} />Saved privately. Your email stays off the listing.</p></form>}</div>;
}
