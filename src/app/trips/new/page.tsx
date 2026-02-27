"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Common timezones for the picker
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
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
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
      router.push("/login");
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

  return (
    <main className="min-h-screen bg-gray-50 px-36 py-8 font-sans text-gray-900">
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          New Trip
        </h1>
      </header>

      <form
        onSubmit={handleCreate}
        className="max-w-md space-y-5 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
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
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400"
          />
        </div>

        {/* Start date */}
        <div>
          <label
            htmlFor="start_date"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Start date
          </label>
          <input
            id="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400"
          />
        </div>

        {/* Ongoing toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={ongoing}
            onClick={() => setOngoing((v) => !v)}
            className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
              ongoing ? "bg-gray-900" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                ongoing ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">This trip is ongoing</span>
        </div>

        {/* End date — hidden when ongoing */}
        {!ongoing && (
          <div>
            <label
              htmlFor="end_date"
              className="mb-1.5 block text-xs font-medium text-gray-600"
            >
              End date
            </label>
            <input
              id="end_date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400"
            />
          </div>
        )}

        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Cover photo URL */}
        <div>
          <label
            htmlFor="cover_photo"
            className="mb-1.5 block text-xs font-medium text-gray-600"
          >
            Cover photo URL
          </label>
          <input
            id="cover_photo"
            type="url"
            value={coverPhotoUrl}
            onChange={(e) => setCoverPhotoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Trip"}
        </button>
      </form>
    </main>
  );
}
