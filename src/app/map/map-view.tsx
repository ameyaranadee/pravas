"use client";

import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

type Tag = { id: string; name: string; color: string };

type TripPin = {
  id: string;
  title: string;
  cover_photo_url: string | null;
  latitude: number;
  longitude: number;
  location_name: string | null;
  tags: Tag[];
};

export default function MapView({
  trips,
  allTags,
}: {
  trips: TripPin[];
  allTags: Tag[];
}) {
  const [selectedTrip, setSelectedTrip] = useState<TripPin | null>(null);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const filtered = filterTagId
    ? trips.filter((t) => t.tags.some((tag) => tag.id === filterTagId))
    : trips;

  const center =
    filtered.length > 0
      ? {
          longitude: filtered[0].longitude,
          latitude: filtered[0].latitude,
          zoom: 3,
        }
      : { longitude: 20, latitude: 20, zoom: 2 };

  return (
    <div className="h-screen w-full">
      <Map
        initialViewState={center}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={token}
        onClick={() => setSelectedTrip(null)}
      >
        <NavigationControl position="bottom-right" />

        {filtered.map((trip) => {
          const primaryColor = trip.tags[0]?.color ?? "#2D323B";
          return (
            <Marker
              key={trip.id}
              longitude={trip.longitude}
              latitude={trip.latitude}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedTrip(trip);
              }}
            >
              <div className="cursor-pointer">
                {trip.cover_photo_url ? (
                  <div
                    className="h-10 w-10 overflow-hidden rounded-full border-2 shadow-md transition-transform hover:scale-110"
                    style={{ borderColor: primaryColor }}
                  >
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
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-md transition-transform hover:scale-110"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {trip.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

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
                <p className="mt-0.5 text-xs text-stone-400">
                  {selectedTrip.location_name}
                </p>
              )}
              {selectedTrip.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedTrip.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: tag.color + "20",
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
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

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm">
          <button
            onClick={() => setFilterTagId(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterTagId === null
                ? "bg-[#2D323B] text-white"
                : "text-stone-500 hover:text-[#2D323B]"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() =>
                setFilterTagId(filterTagId === tag.id ? null : tag.id)
              }
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={{
                backgroundColor:
                  filterTagId === tag.id ? tag.color + "18" : "transparent",
                color: filterTagId === tag.id ? tag.color : "#78716c",
                outline:
                  filterTagId === tag.id ? `2px solid ${tag.color}40` : "none",
                outlineOffset: "1px",
              }}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white/90 p-8 text-center shadow-lg backdrop-blur-sm">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-stone-300" />
            <p className="text-sm font-medium text-stone-500">
              No trips with location data
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Add a location when creating or editing a trip
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
