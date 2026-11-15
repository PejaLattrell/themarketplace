"use client";

import { useEffect, useRef, useState, type FormEvent, type DragEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Camera, Check, ImagePlus, Leaf, LoaderCircle, ShieldCheck, X, AlertCircle } from "lucide-react";
import { CATEGORIES, CONDITIONS, MAX_PHOTO_SIZE, PHOTO_TYPES } from "@/lib/marketplace";
import { getSupabase } from "@/lib/supabase";
import { validateListing } from "@/lib/validation";
import { publishListing } from "@/app/actions";

export function CreateListing() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragging, setDragging] = useState(false);
  const [description, setDescription] = useState("");
  const [publishedId, setPublishedId] = useState("");
  const uploadedPath = useRef("");
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  function selectFile(next?: File) {
    if (busy) return;
    if (!next) return;
    if (!PHOTO_TYPES.includes(next.type)) { setError("Choose a JPG, PNG, or WebP photo."); return; }
    if (next.size > MAX_PHOTO_SIZE) { setError("That photo is a little large. Choose one under 8 MB."); return; }
    if (!next.size) { setError("That photo is empty. Please choose another one."); return; }
    setError(""); setFile(next); uploadedPath.current = "";
  }
  function onDrop(event: DragEvent) { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setError("");
    if (!file) { setError("Add a photo so buyers can see your find."); return; }
    const formData = new FormData(event.currentTarget);
    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const path = uploadedPath.current || `${crypto.randomUUID()}.${ext}`;
    let listing;
    try { listing = validateListing({ ...Object.fromEntries(formData), image_path: path }); }
    catch (error) { setError(error instanceof Error ? error.message : "Check your listing details."); return; }
    setBusy(true);
    try {
      if (!uploadedPath.current) {
        setProgress("Uploading your photo…");
        const { error } = await getSupabase().storage.from("marketplace-images").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
        if (error) throw new Error("Your photo couldn't upload. Check your connection and try again.");
        uploadedPath.current = path;
      }
      setProgress("Publishing your good find…");
      const data = await publishListing(listing);
      if (!data.id) throw new Error(data.error || "We couldn't publish your listing. Please try again.");
      setPublishedId(data.id);
    } catch (error) { setError(error instanceof Error ? error.message : "We couldn't publish your listing. Please try again."); }
    finally { setBusy(false); setProgress(""); }
  }
  if (publishedId) return <main className="success-page page-width"><div className="success-icon"><Check size={34} /></div><div className="eyebrow">A NEW CHAPTER STARTS HERE</div><h1>Your good find is live.</h1><p>Your photo and listing are saved. Someone’s next favorite<br className="desktop-break" /> could be just a message away.</p><Link className="button button-green" href={`/listings/${publishedId}`}>View your listing <ArrowUpRight size={18} /></Link><Link href="/#browse" className="text-button">Back to all finds</Link></main>;
  return <main className="sell-page page-width"><Link href="/" className="back-link"><ArrowLeft size={16} />Back to the finds</Link><div className="sell-page-heading"><div className="eyebrow">LESS CLUTTER. MORE POSSIBILITY.</div><h1>Pass something <em>good</em> along.</h1><p>A few details, one great photo, and a fresh start for your pre-loved piece.</p></div><div className="sell-layout"><form onSubmit={submit} className="listing-form"><div className="form-section-heading"><span>01</span><div><h2>Let’s see your find.</h2><p>A clear photo makes a great first impression.</p></div></div><input ref={inputRef} id="photo" type="file" className="file-input" accept="image/jpeg,image/png,image/webp" onChange={e => selectFile(e.target.files?.[0])} disabled={busy} aria-label="Listing photo" /><div className={`photo-drop ${dragging ? "dragging" : ""} ${preview ? "has-photo" : ""}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>{preview ? <><img src={preview} alt="Your listing photo preview" /><button className="remove-photo" type="button" onClick={() => { setFile(null); uploadedPath.current = ""; if (inputRef.current) inputRef.current.value = ""; }} aria-label="Remove photo" disabled={busy}><X size={18} /></button><button type="button" className="replace-photo" onClick={() => inputRef.current?.click()} disabled={busy}><Camera size={16} />Change photo</button></> : <button type="button" className="upload-trigger" onClick={() => inputRef.current?.click()} disabled={busy}><span className="upload-icon"><ImagePlus size={29} strokeWidth={1.4} /></span><strong>Drop your photo here, or <u>browse files</u></strong><span>JPG, PNG or WebP · Up to 8 MB</span></button>}</div><div className="form-section-heading details-heading"><span>02</span><div><h2>Tell its story.</h2><p>The little details help your find find its person.</p></div></div><div className="field"><label htmlFor="title">Listing title <span>*</span></label><input id="title" name="title" placeholder="e.g. The comfiest vintage accent chair" required minLength={3} maxLength={120} disabled={busy} /></div><div className="field-row"><div className="field"><label htmlFor="category">Category <span>*</span></label><select id="category" name="category" defaultValue="" required disabled={busy}><option value="" disabled>Select a category</option>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select></div><div className="field"><label htmlFor="condition">Condition</label><select id="condition" name="condition" defaultValue="Good" disabled={busy}><option value="" disabled>Select condition</option>{CONDITIONS.map(value => <option key={value}>{value}</option>)}</select></div></div><div className="field"><div className="label-row"><label htmlFor="description">Description <span>*</span></label><span>{description.length}/5,000</span></div><textarea id="description" name="description" rows={5} placeholder="What makes it a good find? Include the condition, dimensions, and any details a buyer should know." required minLength={20} maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} disabled={busy} /><p className="field-hint">Keep it honest. A little wear can be part of the story.</p></div><div className="field-row"><div className="field"><label htmlFor="price">Price (USD) <span>*</span></label><div className="price-input"><span>$</span><input id="price" name="price" type="number" placeholder="0.00" step="0.01" min="0" max="10000000" required disabled={busy} /></div><p className="field-hint">Sharing for free? Enter 0.</p></div><div className="field"><label htmlFor="location">City or neighborhood (optional)</label><input id="location" name="location" placeholder="e.g. Downtown, Portland" minLength={2} maxLength={100} disabled={busy} /><p className="field-hint">Keep your exact address private.</p></div></div><div className="form-section-heading details-heading"><span>03</span><div><h2>Make the connection.</h2><p>No account needed. Just a way to say hello.</p></div></div><div className="field-row"><div className="field"><label htmlFor="seller_name">Your name (optional)</label><input id="seller_name" name="seller_name" placeholder="First name is perfect" autoComplete="given-name" minLength={2} maxLength={60} disabled={busy} /></div><div className="field"><label htmlFor="seller_email">Email address <span>*</span></label><input id="seller_email" name="seller_email" type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} disabled={busy} /></div></div><div className="privacy-note"><ShieldCheck size={18} /><p>Your email is saved privately and never shown on your listing.</p></div>{error && <div className="form-error" role="alert" tabIndex={-1} ref={errorRef}><AlertCircle size={19} /><span>{error}</span></div>}<div className="publish-row"><span>One good find. A whole new beginning.</span><button type="submit" className="button button-green" disabled={busy}>{busy ? <><LoaderCircle size={18} className="spin" />{progress}</> : <>Publish listing <ArrowUpRight size={18} /></>}</button></div></form><aside className="selling-tips"><div className="tips-art"><Camera size={40} strokeWidth={1.2} /><span>✳</span></div><div className="eyebrow">A LITTLE HELP GOES A LONG WAY</div><h2>Good photos.<br />Better connections.</h2><ul><li><Check size={17} /><span>Find a spot with natural light.</span></li><li><Check size={17} /><span>Show the whole item clearly.</span></li><li><Check size={17} /><span>Mention any quirks or wear.</span></li><li><Check size={17} /><span>Set a fair, feel-good price.</span></li></ul><div className="tips-bottom"><Leaf size={22} /><p>Every pre-loved piece that finds a new home is one less thing going to waste.</p></div><p className="listing-note">Listings are public. Share only details you’re comfortable making visible.</p></aside></div></main>;
}
