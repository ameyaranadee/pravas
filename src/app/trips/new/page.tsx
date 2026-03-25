"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const TIMEZONES = [
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Jakarta",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
];

export default function NewTripPage() {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ongoing, setOngoing] = useState(false);
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/");
      return;
    }

    const { data: trip, error: err } = await supabase
      .from("trips")
      .insert({
        title: title.trim(),
        start_date: startDate || null,
        end_date: ongoing ? null : endDate || null,
        timezone: timezone || null,
        cover_photo_url: coverPhotoUrl.trim() || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push(`/trips/${trip.id}`);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-stone-400";
  const labelClass = "mb-1.5 block text-xs font-medium text-stone-500";

  return (
    <div className="min-h-screen bg-white font-sans text-[#2D323B]">
      {/* Navbar */}
      <header className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-[#2D323B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="text-sm font-medium tracking-tight">pravas</span>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">New Trip</h1>
          <p className="mt-1 text-sm text-stone-400">Where are you headed?</p>
        </div>

        <form onSubmit={handleCreate} className="max-w-md space-y-5">
          <div>
            <label htmlFor="title" className={labelClass}>
              Trip name <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              autoFocus
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tokyo Winter 2025"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="start_date" className={labelClass}>
              Start date
            </label>
            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={ongoing}
              onClick={() => setOngoing((v) => !v)}
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                ongoing ? "bg-[#2D323B]" : "bg-stone-200"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  ongoing ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-stone-500">This trip is ongoing</span>
          </div>

          {!ongoing && (
            <div>
              <label htmlFor="end_date" className={labelClass}>
                End date
              </label>
              <input
                id="end_date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="timezone" className={labelClass}>
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={inputClass}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cover_photo" className={labelClass}>
              Cover photo URL
            </label>
            <input
              id="cover_photo"
              type="url"
              value={coverPhotoUrl}
              onChange={(e) => setCoverPhotoUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full rounded-full bg-[#2D323B] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Trip"}
          </button>
        </form>
      </div>
    </div>
  );
}
