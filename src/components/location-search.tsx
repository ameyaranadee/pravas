"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, X, Loader } from "lucide-react";

type GeoResult = {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
};

export type LocationValue = {
  location_name: string;
  latitude: number;
  longitude: number;
};

export function LocationSearch({
  value,
  onSelect,
}: {
  value: LocationValue | null;
  onSelect: (loc: LocationValue | null) => void;
}) {
  const [query, setQuery] = useState(value?.location_name ?? "");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    setQuery(value?.location_name ?? "");
  }, [value?.location_name]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      onSelect(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place,locality,region,country&access_token=${token}&limit=5`
        );
        const data = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const select = (r: GeoResult) => {
    onSelect({
      location_name: r.place_name,
      latitude: r.center[1],
      longitude: r.center[0],
    });
    setQuery(r.place_name);
    setOpen(false);
    setResults([]);
  };

  const clear = () => {
    setQuery("");
    onSelect(null);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search city or place..."
          className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-9 text-sm outline-none transition-colors focus:border-stone-400"
        />
        {loading && (
          <Loader className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-stone-400 pointer-events-none" />
        )}
        {query && !loading && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onMouseDown={() => select(r)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-stone-50"
              >
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
                <span className="truncate">{r.place_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
