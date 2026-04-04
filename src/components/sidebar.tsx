"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, Map, Plus, LogOut } from "lucide-react";

type Trip = {
  id: string;
  title: string;
  cover_photo_url: string | null;
  start_date: string | null;
};

export function Sidebar() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userName, setUserName] = useState("");
  const [userInitials, setUserInitials] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [tripsResult, userResult] = await Promise.all([
        supabase
          .from("trips")
          .select("id, title, cover_photo_url, start_date")
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      if (tripsResult.data) setTrips(tripsResult.data);

      const meta = userResult.data.user?.user_metadata ?? {};
      const fullName: string =
        meta.full_name ?? meta.name ?? userResult.data.user?.email ?? "";
      const parts = fullName.trim().split(/\s+/);
      setUserName(parts[0] ?? "");
      const initials =
        parts.length >= 2
          ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
          : fullName.charAt(0).toUpperCase();
      setUserInitials(initials);
    }
    load();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside className="flex h-screen w-56 flex-shrink-0 flex-col border-r border-stone-100 bg-stone-50">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-[#2D323B]"
        >
          pravas
        </Link>
      </div>

      {/* Nav */}
      <nav className="space-y-0.5 px-3">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/dashboard"
              ? "bg-stone-200 font-medium text-[#2D323B]"
              : "text-stone-500 hover:bg-stone-100 hover:text-[#2D323B]"
          }`}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          Home
        </Link>
        <Link
          href="/map"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/map"
              ? "bg-stone-200 font-medium text-[#2D323B]"
              : "text-stone-500 hover:bg-stone-100 hover:text-[#2D323B]"
          }`}
        >
          <Map className="h-4 w-4 flex-shrink-0" />
          Map
        </Link>
      </nav>

      {/* Divider */}
      <div className="mx-5 my-4 border-t border-stone-100" />

      {/* Trips list */}
      <div className="flex min-h-0 flex-1 flex-col px-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
            Trips
          </span>
          <Link
            href="/trips/new"
            className="rounded-md p-0.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-[#2D323B]"
            aria-label="New trip"
          >
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="flex-1 space-y-0.5 overflow-y-auto">
          {trips.map((trip) => {
            const active = pathname.startsWith(`/trips/${trip.id}`);
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-stone-200 font-medium text-[#2D323B]"
                    : "text-stone-500 hover:bg-stone-100 hover:text-[#2D323B]"
                }`}
              >
                <div className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded bg-stone-200">
                  {trip.cover_photo_url ? (
                    <Image
                      src={trip.cover_photo_url}
                      alt={trip.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[9px] font-bold text-stone-500">
                      {trip.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="truncate">{trip.title}</span>
              </Link>
            );
          })}

          {trips.length === 0 && (
            <p className="px-3 py-2 text-xs text-stone-400">No trips yet</p>
          )}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-stone-100 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-white">
            {userInitials}
          </div>
          <span className="flex-1 truncate text-sm font-medium text-[#2D323B]">
            {userName}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-[#2D323B]"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
