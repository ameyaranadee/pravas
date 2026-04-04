"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Plus, Compass, Globe } from "lucide-react";

type Trip = {
  id: string;
  title: string;
  cover_photo_url: string | null;
};

function Dot({
  active,
  children,
}: {
  active?: boolean;
  children?: React.ReactNode;
}) {
  if (children) {
    return (
      <div
        className={`relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-all ${
          active ? "border-[#2D323B] shadow-sm" : "border-stone-200"
        }`}
      >
        {children}
      </div>
    );
  }
  return (
    <div className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center">
      <div
        className={`h-2.5 w-2.5 rounded-full transition-all ${
          active
            ? "bg-[#2D323B]"
            : "border-2 border-stone-300 bg-white"
        }`}
      />
    </div>
  );
}

export function JourneyNav() {
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
          .select("id, title, cover_photo_url")
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      if (tripsResult.data) setTrips(tripsResult.data);

      const meta = userResult.data.user?.user_metadata ?? {};
      const fullName =
        meta.full_name ?? meta.name ?? userResult.data.user?.email ?? "";
      const parts = fullName.trim().split(/\s+/);
      setUserName(parts[0] ?? "");
      setUserInitials(
        parts.length >= 2
          ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
          : fullName.charAt(0).toUpperCase(),
      );
    }
    load();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isHome = pathname === "/dashboard";
  const isMap = pathname === "/map";
  const isNewTrip = pathname === "/trips/new";

  return (
    <aside className="flex h-screen w-52 flex-shrink-0 flex-col border-r border-stone-100 bg-white">
      {/* Brand */}
      <div className="px-5 pb-3 pt-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold tracking-tight text-[#2D323B]"
        >
          pravas
        </Link>
      </div>

      {/* Journey path */}
      <div className="relative flex-1 overflow-y-auto px-4 py-2">
        {/* The dashed route line — runs behind all waypoints */}
        {/* Dot center = px-4(16px) + item-gap-center(10px) = 26px from aside left */}
        <div
          className="pointer-events-none absolute bottom-2 top-2 w-px border-l-2 border-dashed border-stone-200"
          style={{ left: "26px" }}
        />

        <div className="relative flex flex-col gap-0.5">
          {/* Home */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 rounded-xl py-2 pl-[6px] pr-3 transition-colors ${
              isHome ? "bg-stone-100" : "hover:bg-stone-50"
            }`}
          >
            <Dot active={isHome}>
              <Compass
                className={`h-3 w-3 ${isHome ? "text-[#2D323B]" : "text-stone-400"}`}
              />
            </Dot>
            <span
              className={`text-sm ${isHome ? "font-semibold text-[#2D323B]" : "text-stone-500"}`}
            >
              Home
            </span>
          </Link>

          {/* Map */}
          <Link
            href="/map"
            className={`flex items-center gap-3 rounded-xl py-2 pl-[6px] pr-3 transition-colors ${
              isMap ? "bg-stone-100" : "hover:bg-stone-50"
            }`}
          >
            <Dot active={isMap}>
              <Globe
                className={`h-3 w-3 ${isMap ? "text-[#2D323B]" : "text-stone-400"}`}
              />
            </Dot>
            <span
              className={`text-sm ${isMap ? "font-semibold text-[#2D323B]" : "text-stone-500"}`}
            >
              Map
            </span>
          </Link>

          {/* Trips label */}
          {trips.length > 0 && (
            <div className="flex items-center gap-3 pb-0.5 pl-[6px] pt-3">
              <div className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                Trips
              </span>
            </div>
          )}

          {/* Trip waypoints */}
          {trips.map((trip) => {
            const active = pathname.startsWith(`/trips/${trip.id}`);
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className={`flex items-center gap-3 rounded-xl py-1.5 pl-[6px] pr-3 transition-colors ${
                  active ? "bg-stone-100" : "hover:bg-stone-50"
                }`}
              >
                <Dot active={active}>
                  {trip.cover_photo_url ? (
                    <Image
                      src={trip.cover_photo_url}
                      alt={trip.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-[8px] font-bold text-stone-400">
                      {trip.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Dot>
                <span
                  className={`truncate text-sm ${active ? "font-semibold text-[#2D323B]" : "text-stone-500"}`}
                >
                  {trip.title}
                </span>
              </Link>
            );
          })}

          {/* New trip — dashed circle */}
          <Link
            href="/trips/new"
            className={`flex items-center gap-3 rounded-xl py-2 pl-[6px] pr-3 transition-colors ${
              isNewTrip ? "bg-stone-100" : "hover:bg-stone-50"
            }`}
          >
            <div className="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-dashed border-stone-300 bg-white">
              <Plus className="h-2.5 w-2.5 text-stone-400" />
            </div>
            <span className="text-sm text-stone-400">New trip</span>
          </Link>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-stone-100 p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-white">
            {userInitials}
          </div>
          <span className="flex-1 truncate text-sm font-medium text-[#2D323B]">
            {userName}
          </span>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#2D323B]"
            aria-label="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
