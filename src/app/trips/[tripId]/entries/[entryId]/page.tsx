import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mic, PenLine } from "lucide-react";
import { EntryContent } from "./entry-content";
import { AddWrittenLog } from "./add-written-log";
import { AddAudioLog } from "./add-audio-log";
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
        "id, entry_date, created_at, audio_url, transcription_status, transcript_mr, transcript_en, transcription_error, journal_text",
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

  const status = entry.transcription_status as string;
  const hasJournal = !!entry.journal_text;
  const hasAudio = !!entry.audio_url;
  const hasBoth = hasJournal && hasAudio;

  const date = new Date(entry.entry_date);
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = entry.created_at
    ? new Date(entry.created_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

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

      {/* Centered content */}
      <div className="mx-auto max-w-3xl px-6">
        {/* Entry header */}
        <div className="mb-10 border-b border-stone-100 pb-8">
          <p className="mb-1 text-sm font-medium text-stone-400">{weekday}</p>
          <h1 className="text-3xl font-bold tracking-tight">{dateStr}</h1>
          {timeStr && (
            <div className="mt-3 flex items-center gap-3 text-xs text-stone-400">
              {hasJournal && (
                <span className="flex items-center gap-1.5">
                  <PenLine className="h-3.5 w-3.5" />
                  Written
                </span>
              )}
              {hasBoth && <span>·</span>}
              {hasAudio && (
                <span className="flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5" />
                  Audio log
                </span>
              )}
              <span>· {timeStr}</span>
            </div>
          )}
        </div>

        {/* Written log */}
        {hasJournal && (
          <div className="mb-14">
            {hasBoth && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Written log
              </p>
            )}
            <p className="text-base leading-8 text-[#2D323B] whitespace-pre-wrap">
              {entry.journal_text}
            </p>
          </div>
        )}

        {/* Divider if both */}
        {hasBoth && <hr className="mb-14 border-stone-100" />}

        {/* Audio log */}
        {hasAudio && (
          <div className="mb-16">
            {hasBoth && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Audio log
              </p>
            )}
            <EntryContent
              entryId={entry.id}
              status={status}
              audioUrl={entry.audio_url}
              transcriptEn={entry.transcript_en}
              transcriptMr={entry.transcript_mr}
              transcriptionError={entry.transcription_error}
            />
          </div>
        )}
        {/* Add written log (only if audio exists but no journal) */}
        {hasAudio && !hasJournal && (
          <div className="mb-16">
            <AddWrittenLog entryId={entry.id} />
          </div>
        )}

        {/* Add recording (only if journal exists but no audio) */}
        {hasJournal && !hasAudio && (
          <div className="mb-16">
            <AddAudioLog entryId={entry.id} />
          </div>
        )}
      </div>

      {/* Photos — full bleed */}
      <div className="border-t border-stone-100 pb-24">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-5 pt-8 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Photos
          </p>
        </div>
        <EntryPhotos
          entryId={entry.id}
          userId={user?.id ?? ""}
          initialPhotos={photos ?? []}
          centeredControls
        />
      </div>
    </div>
  );
}
