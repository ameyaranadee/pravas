import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Loader, AlertCircle } from "lucide-react";
import { TranscriptTabs } from "./transcript-tabs";
import { EntryPhotos } from "@/components/entry-photos";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ tripId: string; entryId: string }>;
}) {
  const { tripId, entryId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: entry }, { data: photos }] = await Promise.all([
    supabase
      .from("entries")
      .select(
        "id, entry_date, created_at, audio_url, transcription_status, transcript_mr, transcript_en, transcription_error",
      )
      .eq("id", entryId)
      .single(),
    supabase
      .from("entry_photos")
      .select("id, url, storage_path")
      .eq("entry_id", entryId)
      .order("created_at"),
  ]);

  if (!entry) notFound();

  const entryDate = new Date(entry.entry_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const status = entry.transcription_status as string;

  return (
    <div className="min-h-screen bg-white font-sans text-[#2D323B]">
      {/* Navbar */}
      <header className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <Link
          href={`/trips/${tripId}`}
          className="flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-[#2D323B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="text-sm font-medium tracking-tight">pravas</span>
      </header>

      <div className="mx-auto max-w-3xl px-6 pb-20">
        {/* Entry heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{entryDate}</h1>
          {entry.created_at && (
            <p className="mt-1 text-sm text-stone-400">
              Recorded at{" "}
              {new Date(entry.created_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,260px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Audio */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Recording
              </p>
              <div className="rounded-2xl border border-stone-200 p-5">
                <audio controls className="w-full" preload="metadata">
                  <source src={entry.audio_url} type="audio/webm; codecs=opus" />
                  <source src={entry.audio_url} type="audio/webm" />
                </audio>
              </div>
            </section>

            {/* Transcription */}
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Transcription
              </p>
              <div className="rounded-2xl border border-stone-200 p-5">
                {status === "done" && entry.transcript_mr && entry.transcript_en && (
                  <TranscriptTabs
                    transcriptMr={entry.transcript_mr}
                    transcriptEn={entry.transcript_en}
                  />
                )}

                {(status === "pending" || status === "processing") && (
                  <div className="flex items-center gap-3 py-2 text-sm text-stone-400">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>
                      {status === "processing"
                        ? "Transcription in progress..."
                        : "Queued for transcription"}
                    </span>
                  </div>
                )}

                {status === "failed" && (
                  <div className="flex items-start gap-3 text-sm text-red-500">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Transcription failed</p>
                      {entry.transcription_error && (
                        <p className="mt-0.5 text-xs text-red-400">
                          {entry.transcription_error}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column — Photos */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Photos
              </p>
              <div className="rounded-2xl border border-stone-200 p-5">
                <EntryPhotos
                  entryId={entry.id}
                  userId={user?.id ?? ""}
                  initialPhotos={photos ?? []}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
