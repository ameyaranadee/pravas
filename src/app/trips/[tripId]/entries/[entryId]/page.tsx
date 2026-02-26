import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Loader, AlertCircle } from "lucide-react";
import { TranscriptTabs } from "./transcript-tabs";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ tripId: string; entryId: string }>;
}) {
  const { tripId, entryId } = await params;
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("entries")
    .select(
      "id, entry_date, created_at, audio_url, transcription_status, transcript_mr, transcript_en, transcription_error"
    )
    .eq("id", entryId)
    .single();

  if (!entry) notFound();

  const entryDate = new Date(entry.entry_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const status = entry.transcription_status as string;

  return (
    <main className="min-h-screen bg-gray-50 px-36 py-8 font-sans text-gray-900">
      {/* Header */}
      <header className="mb-8 flex items-center gap-4">
        <Link
          href={`/trips/${tripId}`}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
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
      </header>

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
    </main>
  );
}
