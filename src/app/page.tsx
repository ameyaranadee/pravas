"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import NextImage from "next/image";
import { Plus, ChevronRight, MapPin, LogOut } from "lucide-react";
import { RecorderBar } from "@/components/recorder-bar";
import { useRouter } from "next/navigation";

type Trip = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  cover_photo_url: string | null;
};

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInitial, setUserInitial] = useState("");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const [tripsResult, userResult] = await Promise.all([
          supabase.from("trips").select("*").order("created_at", { ascending: false }),
          supabase.auth.getUser(),
        ]);

        if (tripsResult.error) throw tripsResult.error;
        setTrips(tripsResult.data || []);

        const email = userResult.data.user?.email ?? "";
        setUserInitial(email.charAt(0).toUpperCase());
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
    router.push("/login");
  };

  const activeTrip = trips[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 font-sans text-[#2D323B] sm:px-8 lg:px-36">
      {/* Header */}
      <header className="mb-10 flex items-center justify-between">
        <NextImage src="/pravas_logo.png" alt="Pravas" height={36} width={120} className="object-contain" />
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border border-stone-300 bg-white/60 pl-1 pr-3 py-1 text-sm text-gray-600 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-white">
            {userInitial}
          </div>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Quick Recorder */}
      <section className="mb-10">
        <RecorderBar trips={trips} />
      </section>

      {/* Active Trip */}
      {activeTrip ? (
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Current Trip
          </p>
          <Link
            href={`/trips/${activeTrip.id}`}
            className="group flex items-start justify-between rounded-2xl border border-stone-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md hover:bg-white"
          >
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-stone-400">
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
              <h3 className="text-2xl font-bold tracking-tight text-[#2D323B]">
                {activeTrip.title}
              </h3>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-dashed border-stone-300 p-10 text-center">
          <p className="mb-4 text-sm text-stone-500">No trips yet. Start your first journey.</p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900"
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
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white/60 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" />
            New Trip
          </Link>
        </div>

        <div className="space-y-2">
          {trips.length > 0 ? (
            trips.map((trip, i) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white/60 px-4 py-3.5 transition-all hover:bg-white hover:shadow-sm"
              >
                <span className="w-5 flex-shrink-0 text-right text-xs font-medium text-stone-300">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2D323B]">
                    {trip.title}
                  </p>
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
            <p className="text-sm text-stone-400">No trips yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
