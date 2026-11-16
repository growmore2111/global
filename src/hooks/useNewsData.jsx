import { useState, useEffect } from "react";
import Papa from "papaparse";

const SHEET_URL = import.meta.env.VITE_NEWS_SHEET_URL;
const CACHE_KEY = "live_news_cache_v1";

export function useNewsData() {
  const [news, setNews] = useState(() => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(
    () => Boolean(SHEET_URL) && !sessionStorage.getItem(CACHE_KEY)
  );
  const [error, setError] = useState(() =>
    SHEET_URL ? null : "Missing VITE_NEWS_SHEET_URL in .env file"
  );

  useEffect(() => {
    if (!SHEET_URL) return;

    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const formatted = results.data
          .filter(
            (row) =>
              row.slug?.trim() &&
              row.title?.trim() &&
              (row.status || "published").trim().toLowerCase() === "published"
          )
          .map((row) => ({
            id: Number(row.id) || 0,
            slug: row.slug.trim(),
            title: row.title.trim(),
            metaTitle: (row.metaTitle || row.title).trim(),
            metaDescription: (row.metaDescription || row.title).trim(),
            date: (row.date || "").trim(),
            image: (row.image || "").trim(),
            content: row.content || "",
          }))
          .sort((a, b) => b.id - a.id);

        setNews(formatted);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(formatted));
        setLoading(false);
      },
      error: (err) => {
        console.error("Error fetching Google Sheet:", err);
        setError("Failed to load news articles.");
        setLoading(false);
      },
    });
  }, []);

  return { news, loading, error };
}