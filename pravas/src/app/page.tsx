"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Plus, ChevronRight, MapPin, Calendar, LogOut } from "lucide-react";
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
  const pastTrips = trips.slice(1);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-36 py-8 font-sans text-gray-900">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Pravas
        </h1>
        <button
          onClick={handleSignOut}
          className="group flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-1 pr-3 py-1 text-sm text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:text-gray-900"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            {userInitial}
          </div>
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Quick Recorder */}
      <section className="mb-8">
        <RecorderBar trips={trips} />
      </section>

      {/* Active Trip */}
      {activeTrip ? (
        <section className="mb-10">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Continue
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg transition-transform active:scale-[0.98]">
            <div className="p-6">
              <div className="mb-1 flex items-center gap-2 text-blue-600">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Current Trip
                </span>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                {activeTrip.title}
              </h3>
              <p className="mb-6 text-sm text-gray-500">
                {activeTrip.start_date
                  ? new Date(activeTrip.start_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "Date not set"}
              </p>

              <div className="flex gap-3">
                <Link
                  href={`/trips/${activeTrip.id}/new-entry`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-gray-800"
                >
                  <Plus className="h-5 w-5" />
                  New Entry
                </Link>
                <Link
                  href={`/trips/${activeTrip.id}`}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
                  aria-label="View Trip Details"
                >
                  <ChevronRight className="h-6 w-6" />
                </Link>
              </div>
            </div>

            <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-50 opacity-50 blur-3xl"></div>
          </div>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
          <p className="mb-4 text-gray-500">No trips yet.</p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create your first trip
          </Link>
        </section>
      )}

      {/* Past Trips */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Your Trips
        </h2>

        <div className="space-y-3">
          {pastTrips.length > 0 ? (
            pastTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Calendar className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="truncate text-base font-semibold text-gray-900">
                    {trip.title}
                  </h4>
                  <p className="truncate text-xs text-gray-500">
                    {trip.start_date
                      ? new Date(trip.start_date).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                          }
                        )
                      : "No date"}
                  </p>
                </div>

                <ChevronRight className="h-5 w-5 text-gray-300" />
              </Link>
            ))
          ) : (
            <p className="text-sm text-gray-400">No other trips found.</p>
          )}
        </div>
      </section>
    </main>
  );
}
