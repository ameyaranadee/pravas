import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mic, FileText, Clock, AlertCircle, PenLine, BookOpen } from "lucide-react";
import { RecorderBar } from "@/components/recorder-bar";
import { WriteEntryBar } from "@/components/write-entry-bar";
import { TripActions } from "@/components/trip-actions";
import Image from "next/image";

type Entry = {
  id: string;
  entry_date: string;
  created_at: string | null;
  transcription_status: string;
  journal_text: string | null;
  transcript_en: string | null;
  audio_url: string | null;
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
          className={`relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-white ${rotations[i] ?? ""}`}
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
        <span className="ml-3 text-xs text-stone-400">+{extra}</span>
      )}
    </div>
  );
}

function StatusBadge({ status, hasJournal, hasAudio }: { status: string; hasJournal: boolean; hasAudio: boolean }) {
  if (hasJournal && hasAudio) {
    const audioMap: Record<string, string> = {
      pending: "text-stone-400",
      processing: "text-blue-500",
      done: "text-green-600",
      failed: "text-red-500",
    };
    return (
      <span className={`text-xs font-medium ${audioMap[status] ?? "text-stone-400"}`}>
        Written + Audio
      </span>
    );
  }
  if (hasJournal) return <span className="text-xs font-medium text-violet-500">Written</span>;

  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "text-stone-400" },
    processing: { label: "Processing", className: "text-blue-500" },
    done: { label: "Transcribed", className: "text-green-600" },
    failed: { label: "Failed", className: "text-red-500" },
  };
  const config = map[status] ?? { label: status, className: "text-stone-400" };
  return <span className={`text-xs font-medium ${config.className}`}>{config.label}</span>;
}

function EntryIcon({ status, hasJournal, hasAudio }: { status: string; hasJournal: boolean; hasAudio: boolean }) {
  if (hasJournal && hasAudio) return <BookOpen className="h-4 w-4 text-indigo-500" />;
  if (hasJournal) return <PenLine className="h-4 w-4 text-violet-500" />;
  if (status === "done") return <FileText className="h-4 w-4 text-green-600" />;
  if (status === "failed") return <AlertCircle className="h-4 w-4 text-red-400" />;
  if (status === "processing") return <Clock className="h-4 w-4 text-blue-500" />;
  return <Mic className="h-4 w-4 text-stone-400" />;
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createClient();

  const [{ data: trip }, { data: entries }] = await Promise.all([
    supabase
      .from("trips")
      .select("id, title, start_date")
      .eq("id", tripId)
      .single(),
    supabase
      .from("entries")
      .select("id, entry_date, created_at, transcription_status, journal_text, transcript_en, audio_url")
      .eq("trip_id", tripId)
      .order("entry_date", { ascending: false }),
  ]);

  if (!trip) notFound();

  const entryIds = (entries ?? []).map((e) => e.id);
  const photosByEntryId: Record<string, EntryPhoto[]> = {};

  if (entryIds.length > 0) {
    const { data: allPhotos } = await supabase
      .from("entry_photos")
      .select("entry_id, url")
      .in("entry_id", entryIds)
      .order("created_at");

    for (const photo of allPhotos ?? []) {
      if (!photosByEntryId[photo.entry_id])
        photosByEntryId[photo.entry_id] = [];
      photosByEntryId[photo.entry_id].push(photo);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 pb-20">
      {/* Trip title */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{trip.title}</h1>
          <TripActions tripId={trip.id} />
        </div>
        {trip.start_date && (
          <p className="mt-1 text-sm text-stone-400">
            {new Date(trip.start_date).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Recorder + Journal */}
      <section className="mb-10 space-y-3">
        <RecorderBar fixedTripId={trip.id} />
        <WriteEntryBar tripId={trip.id} />
      </section>

      {/* Divider */}
      <hr className="mb-8 border-stone-100" />

      {/* Entries */}
      <section>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
          Entries · {entries?.length ?? 0}
        </p>

        {entries && entries.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {entries.map((entry: Entry) => {
              const entryDate = new Date(entry.entry_date);
              const createdAt = entry.created_at ? new Date(entry.created_at) : null;
              const hasJournal = !!entry.journal_text;
              const hasAudio = !!entry.audio_url;
              const previewText = entry.journal_text ?? entry.transcript_en;

              return (
                <Link
                  key={entry.id}
                  href={`/trips/${tripId}/entries/${entry.id}`}
                  className="group flex items-center gap-4 py-4 transition-colors hover:text-stone-600"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-stone-50">
                    <EntryIcon status={entry.transcription_status} hasJournal={hasJournal} hasAudio={hasAudio} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {entryDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {previewText ? (
                      <p className="mt-0.5 truncate text-xs text-stone-400">
                        {previewText}
                      </p>
                    ) : createdAt ? (
                      <p className="mt-0.5 text-xs text-stone-400">
                        Recorded at{" "}
                        {createdAt.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    ) : null}
                    {(photosByEntryId[entry.id]?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <PhotoStack
                          photos={photosByEntryId[entry.id] ?? []}
                        />
                      </div>
                    )}
                  </div>

                  <StatusBadge status={entry.transcription_status} hasJournal={hasJournal} hasAudio={hasAudio} />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 p-10 text-center">
            <Mic className="mx-auto mb-3 h-6 w-6 text-stone-300" />
            <p className="text-sm text-stone-400">No entries yet.</p>
            <p className="mt-1 text-xs text-stone-300">
              Record a memory or write a journal entry above.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
