"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Plus, ChevronRight, MapPin, LogOut } from "lucide-react";
import { RecorderBar } from "@/components/recorder-bar";
import { DashboardMap } from "@/components/dashboard-map";
import { useRouter } from "next/navigation";

type Trip = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cover_photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInitials, setUserInitials] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const [tripsResult, userResult] = await Promise.all([
          supabase
            .from("trips")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.auth.getUser(),
        ]);

        if (tripsResult.error) throw tripsResult.error;
        setTrips(tripsResult.data || []);

        const meta = userResult.data.user?.user_metadata ?? {};
        const fullName: string = meta.full_name ?? meta.name ?? userResult.data.user?.email ?? "";
        const parts = fullName.trim().split(/\s+/);
        const initials = parts.length >= 2
          ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
          : fullName.charAt(0).toUpperCase();
        setUserInitials(initials);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const activeTrip = trips[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#2D323B]">
      {/* Navbar */}
      <header className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <span className="text-sm font-medium tracking-tight">pravas</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-500 transition-colors hover:border-stone-300 hover:text-[#2D323B]"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-white">
            {userInitials}
          </div>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-20">
        {/* Recorder */}
        <section className="mb-10">
          <RecorderBar trips={trips} />
        </section>

        {/* Travel map */}
        <DashboardMap trips={trips} />

        {/* Current Trip */}
        {activeTrip ? (
          <section className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Current Trip
            </p>
            <Link
              href={`/trips/${activeTrip.id}`}
              className="group relative flex items-end justify-between overflow-hidden rounded-2xl border border-stone-200 p-6 transition-colors"
              style={{ minHeight: "140px" }}
            >
              {/* Cover photo background */}
              {activeTrip.cover_photo_url && (
                <>
                  <Image
                    src={activeTrip.cover_photo_url}
                    alt={activeTrip.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </>
              )}
              <div className={`relative ${activeTrip.cover_photo_url ? "text-white" : ""}`}>
                <div className={`mb-1.5 flex items-center gap-1.5 ${activeTrip.cover_photo_url ? "text-white/70" : "text-stone-400"}`}>
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {activeTrip.start_date
                      ? new Date(activeTrip.start_date).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Date not set"}
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">{activeTrip.title}</h3>
              </div>
              <ChevronRight className={`relative mb-1 h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${activeTrip.cover_photo_url ? "text-white/60" : "text-stone-300"}`} />
            </Link>
          </section>
        ) : (
          <section className="mb-10 rounded-2xl border border-dashed border-stone-200 p-10 text-center">
            <p className="mb-4 text-sm text-stone-500">No trips yet. Start your first journey.</p>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 rounded-full bg-[#2D323B] px-5 py-2 text-sm font-medium text-white hover:opacity-80"
            >
              <Plus className="h-4 w-4" /> Create a trip
            </Link>
          </section>
        )}

        {/* All Trips */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              All Trips
            </p>
            <Link
              href="/trips/new"
              className="flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-[#2D323B]"
            >
              <Plus className="h-3.5 w-3.5" />
              New Trip
            </Link>
          </div>

          <div className="divide-y divide-stone-100">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="group flex items-center gap-4 py-3.5 transition-colors hover:text-stone-600"
                >
                  {/* Thumbnail */}
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {trip.cover_photo_url ? (
                      <Image
                        src={trip.cover_photo_url}
                        alt={trip.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-stone-400">
                        {trip.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{trip.title}</p>
                    <p className="truncate text-xs text-stone-400">
                      {trip.start_date
                        ? new Date(trip.start_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                          })
                        : "No date"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            ) : (
              <p className="py-4 text-sm text-stone-400">No trips yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
