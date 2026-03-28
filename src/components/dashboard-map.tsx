"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";

type TripPin = {
  id: string;
  title: string;
  cover_photo_url: string | null;
  latitude: number;
  longitude: number;
};

function MapInner({ trips }: { trips: TripPin[] }) {
  const [selectedTrip, setSelectedTrip] = useState<TripPin | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Compute center from trips
  const avgLng = trips.reduce((s, t) => s + t.longitude, 0) / trips.length;
  const avgLat = trips.reduce((s, t) => s + t.latitude, 0) / trips.length;

  return (
    <Map
      initialViewState={{ longitude: avgLng, latitude: avgLat, zoom: trips.length === 1 ? 4 : 2 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={token}
      scrollZoom={false}
      dragPan={false}
      dragRotate={false}
      doubleClickZoom={false}
      touchZoomRotate={false}
      onClick={() => setSelectedTrip(null)}
      attributionControl={false}
    >
      {trips.map((trip) => (
        <Marker
          key={trip.id}
          longitude={trip.longitude}
          latitude={trip.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            setSelectedTrip(selectedTrip?.id === trip.id ? null : trip);
          }}
        >
          <div className="cursor-pointer">
            {trip.cover_photo_url ? (
              <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white shadow-md transition-transform hover:scale-110">
                <Image
                  src={trip.cover_photo_url}
                  alt={trip.title}
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2D323B] text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110">
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
          offset={10}
          onClose={() => setSelectedTrip(null)}
          closeOnClick={false}
          className="pravas-popup"
        >
          <Link
            href={`/trips/${selectedTrip.id}`}
            className="flex items-center gap-2 p-2.5 hover:bg-stone-50"
          >
            {selectedTrip.cover_photo_url && (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={selectedTrip.cover_photo_url}
                  alt={selectedTrip.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <span className="text-xs font-semibold text-[#2D323B]">
              {selectedTrip.title}
            </span>
          </Link>
        </Popup>
      )}
    </Map>
  );
}

// Dynamic import to avoid SSR
const MapInnerDynamic = dynamic(() => Promise.resolve(MapInner), { ssr: false });

export function DashboardMap({ trips }: { trips: TripPin[] }) {
  const pinned = trips.filter((t) => t.latitude != null && t.longitude != null);

  if (pinned.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Your Travels
        </p>
        <Link
          href="/map"
          className="flex items-center gap-1 text-xs text-stone-400 transition-colors hover:text-[#2D323B]"
        >
          Full map
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="h-52 overflow-hidden rounded-2xl border border-stone-100">
        <MapInnerDynamic trips={pinned} />
      </div>
    </section>
  );
}
