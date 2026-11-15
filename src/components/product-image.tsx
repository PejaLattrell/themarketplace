"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

export function ProductImage({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  const [failedSrc, setFailedSrc] = useState("");
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth === 0) setFailedSrc(src);
  }, [src]);
  if (failedSrc === src) return <div className={`image-placeholder ${className}`} role="img" aria-label={alt}><ImageOff size={28} /><span>Photo unavailable</span></div>;
  // Direct image loading keeps uploads full quality and does not proxy private file URLs.
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} className={className} src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" onError={() => setFailedSrc(src)} />;
}
