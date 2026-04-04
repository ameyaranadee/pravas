import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { TripCanvas, type TripNode } from "@/components/trip-canvas";
import { CanvasUserButton } from "@/components/canvas-user-button";

export default async function Dashboard() {
  const supabase = await createClient();

  const [{ data: trips }, { data: authData }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, title, cover_photo_url, start_date")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  // Fetch entry photos per trip (up to 3 each)
  const photosByTrip: Record<string, string[]> = {};
  if (trips && trips.length > 0) {
    const tripIds = trips.map((t) => t.id);

    const { data: entries } = await supabase
      .from("entries")
      .select("id, trip_id")
      .in("trip_id", tripIds);

    const tripByEntryId: Record<string, string> = {};
    for (const e of entries ?? []) tripByEntryId[e.id] = e.trip_id;

    const entryIds = (entries ?? []).map((e) => e.id);
    if (entryIds.length > 0) {
      const { data: photos } = await supabase
        .from("entry_photos")
        .select("url, entry_id")
        .in("entry_id", entryIds)
        .order("created_at", { ascending: false })
        .limit(300);

      for (const photo of photos ?? []) {
        const tripId = tripByEntryId[photo.entry_id];
        if (tripId) {
          if (!photosByTrip[tripId]) photosByTrip[tripId] = [];
          if (photosByTrip[tripId].length < 3) photosByTrip[tripId].push(photo.url);
        }
      }
    }
  }

  const tripNodes: TripNode[] = (trips ?? []).map((trip) => ({
    id: trip.id,
    title: trip.title,
    cover_photo_url: trip.cover_photo_url,
    start_date: trip.start_date,
    entry_photos: photosByTrip[trip.id] ?? [],
  }));

  // User initials
  const user = authData?.user;
  const meta = user?.user_metadata ?? {};
  const fullName: string = meta.full_name ?? meta.name ?? user?.email ?? "";
  const parts = fullName.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
      : fullName.charAt(0).toUpperCase() || "?";

  return (
    <div className="fixed inset-0 bg-[#F5F2EB]">

      {/* Layer 2: trip canvas — transparent, floats over map */}
      <div className="absolute inset-0">
        <TripCanvas trips={tripNodes} />
      </div>

      {/* Layer 3: floating header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-5 py-3">
        <Link href="/dashboard" className="pointer-events-auto">
          <Image
            src="/pravas.png"
            alt="pravas"
            width={683}
            height={365}
            className="h-12 w-auto"
            priority
          />
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/trips/new"
            className="flex items-center gap-1.5 rounded-full bg-[#2D323B]/85 px-4 py-2 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-opacity hover:opacity-80"
          >
            <Plus className="h-3 w-3" />
            New trip
          </Link>
          <CanvasUserButton initials={initials} />
        </div>
      </header>
    </div>
  );
}
