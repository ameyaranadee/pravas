import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mic, FileText, Clock, AlertCircle } from "lucide-react";
import { RecorderBar } from "@/components/recorder-bar";
import Image from "next/image";

type Entry = {
  id: string;
  entry_date: string;
  created_at: string | null;
  transcription_status: string;
  transcript_en: string | null;
};

type EntryPhoto = {
  entry_id: string;
  url: string;
};

function PhotoStack({ photos }: { photos: EntryPhoto[] }) {
  if (!photos.length) return null;
  const visible = photos.slice(0, 3);
  const extra = photos.length - visible.length;
  const rotations = ["-rotate-3", "rotate-0", "rotate-3"];

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((photo, i) => (
        <div
          key={i}
          className={`relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-white ${rotations[i] ?? ""}`}
        >
          <Image
            src={photo.url}
            alt="Entry photo"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ))}
      {extra > 0 && (
        <span className="ml-3 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          +{extra}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-gray-100 text-gray-500",
    },
    processing: {
      label: "Processing",
      className: "bg-blue-50 text-blue-600",
    },
    done: {
      label: "Transcribed",
      className: "bg-green-50 text-green-600",
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-500",
    },
  };

  const config = map[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function EntryIcon({ status }: { status: string }) {
  if (status === "done") return <FileText className="h-5 w-5 text-green-600" />;
  if (status === "failed") return <AlertCircle className="h-5 w-5 text-red-400" />;
  if (status === "processing") return <Clock className="h-5 w-5 text-blue-500" />;
  return <Mic className="h-5 w-5 text-gray-400" />;
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();

  const [{ data: trip }, { data: entries }] = await Promise.all([
    supabase.from("trips").select("id, title, start_date").eq("id", tripId).single(),
    supabase
      .from("entries")
      .select("id, entry_date, created_at, transcription_status, transcript_en")
      .eq("trip_id", tripId)
      .order("entry_date", { ascending: false }),
  ]);

  if (!trip) notFound();

  const entryIds = (entries ?? []).map((e) => e.id);
  let photosByEntryId: Record<string, EntryPhoto[]> = {};

  if (entryIds.length > 0) {
    const { data: allPhotos } = await supabase
      .from("entry_photos")
      .select("entry_id, url")
      .in("entry_id", entryIds)
      .order("created_at");

    for (const photo of allPhotos ?? []) {
      if (!photosByEntryId[photo.entry_id]) photosByEntryId[photo.entry_id] = [];
      photosByEntryId[photo.entry_id].push(photo);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 font-sans text-gray-900 sm:px-8 lg:px-36">
      {/* Header */}
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {trip.title}
          </h1>
          {trip.start_date && (
            <p className="text-sm text-gray-400">
              {new Date(trip.start_date).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </header>

      {/* Recorder */}
      <section className="mb-8">
        <RecorderBar fixedTripId={trip.id} />
      </section>

      {/* Entries */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Entries · {entries?.length ?? 0}
        </h2>

        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry: Entry) => {
              const entryDate = new Date(entry.entry_date);
              const createdAt = entry.created_at ? new Date(entry.created_at) : null;

              return (
                <Link
                  key={entry.id}
                  href={`/trips/${tripId}/entries/${entry.id}`}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-50">
                    <EntryIcon status={entry.transcription_status} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900">
                      {entryDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {entry.transcript_en ? (
                      <p className="mt-0.5 truncate text-sm text-gray-400">
                        {entry.transcript_en}
                      </p>
                    ) : createdAt ? (
                      <p className="mt-0.5 text-xs text-gray-400">
                        Recorded at{" "}
                        {createdAt.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                    {(photosByEntryId[entry.id]?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <PhotoStack photos={photosByEntryId[entry.id] ?? []} />
                      </div>
                    )}
                  </div>

                  <StatusBadge status={entry.transcription_status} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
            <Mic className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No entries yet.</p>
            <p className="mt-1 text-xs text-gray-300">
              Record a memory from the home screen.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
