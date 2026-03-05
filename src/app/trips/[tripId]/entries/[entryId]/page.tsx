import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
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
        "id, entry_date, created_at, audio_url, transcription_status, transcript_mr, transcript_en, transcription_error"
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
    <main className="min-h-screen bg-transparent px-4 py-8 font-sans text-[#2D323B] sm:px-8 lg:px-36">
      {/* Header */}
      <header className="mb-8 flex items-center gap-4">
        <Link
          href={`/trips/${tripId}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-[#2D323B]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2D323B]">
            {entryDate}
          </h1>
          {entry.created_at && (
            <p className="text-sm text-gray-400">
              Recorded at{" "}
              {new Date(entry.created_at).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <Image src="/pravas_logo.png" alt="Pravas" height={24} width={80} className="ml-auto object-contain opacity-60" />
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr,280px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Audio Player */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Recording
            </h2>
            <audio controls className="w-full" preload="metadata">
              <source src={entry.audio_url} type="audio/webm; codecs=opus" />
              <source src={entry.audio_url} type="audio/webm" />
            </audio>
          </section>

          {/* Transcription */}
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Transcription
            </h2>

            {status === "done" && entry.transcript_mr && entry.transcript_en && (
              <TranscriptTabs
                transcriptMr={entry.transcript_mr}
                transcriptEn={entry.transcript_en}
              />
            )}

            {(status === "pending" || status === "processing") && (
              <div className="flex items-center gap-3 py-4 text-sm text-gray-400">
                <Loader className="h-4 w-4 animate-spin text-blue-500" />
                <span>
                  {status === "processing"
                    ? "Transcription in progress..."
                    : "Queued for transcription"}
                </span>
              </div>
            )}

            {status === "failed" && (
              <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600">
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
          </section>
        </div>

        {/* Right column - Photos */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Photos
            </h2>
            <EntryPhotos
              entryId={entry.id}
              userId={user?.id ?? ""}
              initialPhotos={photos ?? []}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
