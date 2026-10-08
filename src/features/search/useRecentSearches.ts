import { useCallback, useState } from "react";

export const RECENT_SEARCHES_KEY = "daydreamin:recent-searches:v1";

function readRecentSearches(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);

  const addRecentSearch = useCallback((query: string) => {
    const normalized = query.trim();
    if (!normalized) return;
    setRecentSearches((current) => {
      const next = [
        normalized,
        ...current.filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
      ].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentSearches, addRecentSearch };
}
