"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SavedContext = createContext<{ saved: string[]; toggle: (id: string) => void }>({ saved: [], toggle: () => {} });

export function SavedProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try { const value = JSON.parse(localStorage.getItem("good-finds-saved") || "[]"); if (Array.isArray(value)) setSaved(value.filter(v => typeof v === "string")); } catch { /* Private browsing may disable storage. */ }
  }, []);
  function toggle(id: string) {
    setSaved(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      try { localStorage.setItem("good-finds-saved", JSON.stringify(next)); } catch { /* Saving still works for this visit. */ }
      return next;
    });
  }
  return <SavedContext.Provider value={{ saved, toggle }}>{children}</SavedContext.Provider>;
}

export const useSaved = () => useContext(SavedContext);
