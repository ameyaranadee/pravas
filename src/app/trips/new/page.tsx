"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { LocationSearch, type LocationValue } from "@/components/location-search";
import { TagPicker } from "@/components/tag-picker";

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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    let coverPhotoUrl: string | null = null;
    if (coverFile) {
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const storagePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("trip-covers")
        .upload(storagePath, coverFile, { contentType: coverFile.type });
      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("trip-covers")
        .getPublicUrl(storagePath);
      coverPhotoUrl = publicUrl;
    }

    const { data: trip, error: err } = await supabase
      .from("trips")
      .insert({
        title: title.trim(),
        start_date: startDate || null,
        end_date: ongoing ? null : endDate || null,
        timezone: timezone || null,
        cover_photo_url: coverPhotoUrl,
        created_by: user.id,
        location_name: location?.location_name ?? null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      })
      .select("id")
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    if (selectedTagIds.length > 0) {
      await supabase
        .from("trip_tag_assignments")
        .insert(selectedTagIds.map((tagId) => ({ trip_id: trip.id, tag_id: tagId })));
    }

    router.push(`/trips/${trip.id}`);
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

        <form onSubmit={handleCreate} className="space-y-5">
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
            <label className={labelClass}>Location</label>
            <LocationSearch value={location} onSelect={setLocation} />
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
              className={`relative h-5 w-9 flex-shrink-0 overflow-hidden rounded-full transition-colors ${
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
            <label className={labelClass}>Cover photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setCoverFile(file);
                setCoverPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {coverPreview ? (
              <div className="relative h-40 w-full overflow-hidden rounded-xl border border-stone-200">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-stone-200 px-4 py-5 text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-500"
              >
                <ImagePlus className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Upload a cover photo</span>
              </button>
            )}
          </div>

          <div>
            <label className={labelClass}>Tags</label>
            <TagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
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
