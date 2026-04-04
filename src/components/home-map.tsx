"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

type TripPin = {
  id: string;
  title: string;
  cover_photo_url: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
};

function HomeMapInner({ trips }: { trips: TripPin[] }) {
  const [selectedTrip, setSelectedTrip] = useState<TripPin | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const initialView =
    trips.length > 0
      ? {
          longitude:
            trips.reduce((s, t) => s + t.longitude, 0) / trips.length,
          latitude: trips.reduce((s, t) => s + t.latitude, 0) / trips.length,
          zoom: trips.length === 1 ? 4 : 2,
        }
      : { longitude: 20, latitude: 20, zoom: 2 };

  return (
    <div className="relative h-full w-full">
      <Map
        initialViewState={initialView}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={token}
        onClick={() => setSelectedTrip(null)}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />

        {trips.map((trip) => (
          <Marker
            key={trip.id}
            longitude={trip.longitude}
            latitude={trip.latitude}
            anchor="bottom"
          >
            <div
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
              }}
            >
              {trip.cover_photo_url ? (
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform hover:scale-110">
                  <Image
                    src={trip.cover_photo_url}
                    alt={trip.title}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D323B] text-xs font-bold text-white shadow-md transition-transform hover:scale-110">
                  {trip.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </Marker>
        ))}

        {selectedTrip && (
          <Popup
            longitude={selectedTrip.longitude}
            latitude={selectedTrip.latitude}
            anchor="top"
            offset={12}
            onClose={() => setSelectedTrip(null)}
            closeOnClick={false}
            className="pravas-popup"
          >
            <div className="min-w-[200px] p-3">
              {selectedTrip.cover_photo_url && (
                <div className="relative mb-2.5 h-24 w-full overflow-hidden rounded-lg">
                  <Image
                    src={selectedTrip.cover_photo_url}
                    alt={selectedTrip.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <p className="text-sm font-semibold text-[#2D323B]">
                {selectedTrip.title}
              </p>
              {selectedTrip.location_name && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                  <MapPin className="h-3 w-3" />
                  {selectedTrip.location_name}
                </p>
              )}
              <Link
                href={`/trips/${selectedTrip.id}`}
                className="mt-3 block w-full rounded-lg bg-[#2D323B] py-1.5 text-center text-xs font-medium text-white transition-opacity hover:opacity-80"
              >
                Open trip
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {trips.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white/90 px-8 py-10 text-center shadow-lg backdrop-blur-sm">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-stone-300" />
            <p className="text-sm font-medium text-stone-600">
              No trips on the map yet
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Add a location when creating a trip to see it here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const HomeMapDynamic = dynamic<{ trips: TripPin[] }>(
  () => Promise.resolve(HomeMapInner),
  { ssr: false }
);

export function HomeMap({ trips }: { trips: TripPin[] }) {
  return <HomeMapDynamic trips={trips} />;
}
