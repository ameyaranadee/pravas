"use client";

import { useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export type TripNode = {
  id: string;
  title: string;
  cover_photo_url: string | null;
  start_date: string | null;
  entry_photos: string[];
};

// FNV-1a hash → [0, 1)
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

// Seeded placeholder color from the trip id
function placeholderBg(id: string): string {
  const palette = [
    "#A8B5C1",
    "#B5A8C1",
    "#A8C1B5",
    "#C1B5A8",
    "#A8B5A8",
    "#C1A8A8",
  ];
  return palette[Math.floor(rand(id + ":bg") * palette.length)];
}

interface ClusterLayout {
  x: number;
  y: number;
  rotation: number;
}

const COL_GAP = 210;
const ROW_GAP = 225;
const CLUSTER_W = 165;
const CLUSTER_H = 175;
const CANVAS_PAD = 160;

const PHOTO_W = 148;
const PHOTO_H = 112;

function buildLayout(trips: TripNode[]): ClusterLayout[] {
  const cols = Math.max(2, Math.ceil(Math.sqrt(trips.length * 1.3)));
  return trips.map((trip, i) => ({
    x: (i % cols) * COL_GAP + (rand(trip.id + ":jx") - 0.5) * 100,
    y: Math.floor(i / cols) * ROW_GAP + (rand(trip.id + ":jy") - 0.5) * 70,
    rotation: (rand(trip.id + ":rot") - 0.5) * 16,
  }));
}

function TripCluster({
  trip,
  pos,
}: {
  trip: TripNode;
  pos: ClusterLayout & { x: number; y: number };
}) {
  const router = useRouter();
  const downPos = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(e: React.PointerEvent) {
    downPos.current = { x: e.clientX, y: e.clientY };
  }

  function handleClick(e: React.MouseEvent) {
    if (!downPos.current) return;
    const moved =
      Math.abs(e.clientX - downPos.current.x) > 6 ||
      Math.abs(e.clientY - downPos.current.y) > 6;
    downPos.current = null;
    if (!moved) router.push(`/trips/${trip.id}`);
  }

  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        left: pos.x,
        top: pos.y,
        width: CLUSTER_W,
        transform: `rotate(${pos.rotation}deg)`,
        // Rotate around the pin point (top-center of photo)
        transformOrigin: `${CLUSTER_W / 2}px 13px`,
      }}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <div className="group flex flex-col items-center transition-all duration-200 hover:scale-[1.06] hover:-translate-y-1">
        {/* Pin head — echoes the circle endpoint on the pravas logo arc */}
        <div
          className="z-10 flex items-center justify-center rounded-full"
          style={{
            width: 14,
            height: 14,
            background: "radial-gradient(circle at 35% 35%, #6B7280, #2D323B)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
            marginBottom: 2,
          }}
        >
          {/* Specular highlight */}
          <div
            className="rounded-full"
            style={{
              width: 4,
              height: 4,
              background: "rgba(255,255,255,0.35)",
              marginTop: -2,
              marginLeft: -2,
            }}
          />
        </div>

        {/* Cover photo — directional shadow (light from top-left) */}
        <div
          className="overflow-hidden"
          style={{
            width: PHOTO_W,
            height: PHOTO_H,
            boxShadow:
              "4px 7px 22px rgba(0,0,0,0.40), 1px 2px 5px rgba(0,0,0,0.22)",
          }}
        >
          {trip.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={trip.cover_photo_url}
              alt={trip.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: placeholderBg(trip.id) }}
            >
              <span className="text-3xl font-bold text-white/80">
                {trip.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Paper label tag */}
        <div
          className="mt-[8px] bg-[#FFFDF7] px-[8px] py-[4px]"
          style={{
            maxWidth: PHOTO_W,
            boxShadow: "1px 2px 4px rgba(0,0,0,0.18)",
          }}
        >
          <p className="truncate text-center text-[10px] font-semibold text-stone-700 leading-tight">
            {trip.title}
          </p>
          {trip.start_date && (
            <p className="text-center text-[9px] text-stone-500 mt-[2px]">
              {new Date(trip.start_date).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TripCanvas({ trips }: { trips: TripNode[] }) {
  const positions = buildLayout(trips);

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  positions.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x + CLUSTER_W > maxX) maxX = p.x + CLUSTER_W;
    if (p.y + CLUSTER_H > maxY) maxY = p.y + CLUSTER_H;
  });

  if (!isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = 600;
    maxY = 400;
  }

  const canvasW = maxX - minX + CANVAS_PAD * 2;
  const canvasH = maxY - minY + CANVAS_PAD * 2;
  const offsetX = -minX + CANVAS_PAD;
  const offsetY = -minY + CANVAS_PAD;

  if (trips.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-3 text-sm text-stone-500">
            Your scrapbook is empty.
          </p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#2D323B] px-4 py-2 text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-80"
          >
            <Plus className="h-3 w-3" />
            Create your first trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TransformWrapper
      initialScale={0.85}
      centerOnInit
      limitToBounds={false}
      minScale={0.2}
      maxScale={2.5}
    >
      <TransformComponent
        wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}
        contentStyle={{
          width: canvasW,
          height: canvasH,
          position: "relative",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, #bfb8ad 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />

        {trips.map((trip, i) => (
          <TripCluster
            key={trip.id}
            trip={trip}
            pos={{
              ...positions[i],
              x: positions[i].x + offsetX,
              y: positions[i].y + offsetY,
            }}
          />
        ))}
      </TransformComponent>
    </TransformWrapper>
  );
}
