"use client";

import { useState, useEffect } from "react";
import { Mic, ChevronDown, ChevronUp, Loader, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  entryId: string;
  status: string;
  audioUrl: string | null;
  transcriptEn: string | null;
  transcriptMr: string | null;
  transcriptionError: string | null;
};

export function EntryContent({
  entryId,
  status: initialStatus,
  audioUrl,
  transcriptEn: initialTranscriptEn,
  transcriptMr: initialTranscriptMr,
  transcriptionError: initialError,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [transcriptEn, setTranscriptEn] = useState(initialTranscriptEn);
  const [transcriptMr, setTranscriptMr] = useState(initialTranscriptMr);
  const [transcriptionError, setTranscriptionError] = useState(initialError);
  const [lang, setLang] = useState<"en" | "mr">("en");
  const [audioOpen, setAudioOpen] = useState(false);

  const supabase = createClient();

  // Poll while transcription is in progress
  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("entries")
        .select("transcription_status, transcript_en, transcript_mr, transcription_error")
        .eq("id", entryId)
        .single();

      if (!data || data.transcription_status === status) return;

      setStatus(data.transcription_status);
      setTranscriptEn(data.transcript_en ?? null);
      setTranscriptMr(data.transcript_mr ?? null);
      setTranscriptionError(data.transcription_error ?? null);
    }, 3000);

    return () => clearInterval(interval);
  }, [status, entryId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === "done" && transcriptEn) {
    return (
      <div>
        {/* Language toggle */}
        {transcriptMr && (
          <div className="mb-5 flex items-center gap-1 rounded-lg bg-stone-100 p-1 w-fit">
            <button
              onClick={() => setLang("en")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                lang === "en"
                  ? "bg-white text-[#2D323B] shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLang("mr")}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                lang === "mr"
                  ? "bg-white text-[#2D323B] shadow-sm"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              मराठी
            </button>
          </div>
        )}

        {/* Journal prose */}
        <p className="text-base leading-8 text-[#2D323B] whitespace-pre-wrap">
          {lang === "en" ? transcriptEn : transcriptMr}
        </p>

        {/* Collapsible audio */}
        {audioUrl && (
          <div className="mt-8 border-t border-stone-100 pt-5">
            <button
              onClick={() => setAudioOpen((v) => !v)}
              className="flex items-center gap-2 text-sm text-stone-400 transition-colors hover:text-stone-600"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Listen to recording</span>
              {audioOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            {audioOpen && (
              <div className="mt-3">
                <audio controls className="w-full" preload="metadata">
                  <source src={audioUrl} type="audio/webm; codecs=opus" />
                  <source src={audioUrl} type="audio/webm" />
                </audio>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (status === "pending" || status === "processing") {
    return (
      <div>
        {audioUrl && (
          <audio controls className="w-full mb-6" preload="metadata">
            <source src={audioUrl} type="audio/webm; codecs=opus" />
            <source src={audioUrl} type="audio/webm" />
          </audio>
        )}
        <div className="flex items-center gap-3 text-sm text-stone-400">
          <Loader className="h-4 w-4 animate-spin flex-shrink-0" />
          <span>
            {status === "processing"
              ? "Transcribing your log..."
              : "Queued for transcription"}
          </span>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div>
        {audioUrl && (
          <audio controls className="w-full mb-6" preload="metadata">
            <source src={audioUrl} type="audio/webm; codecs=opus" />
            <source src={audioUrl} type="audio/webm" />
          </audio>
        )}
        <div className="flex items-start gap-3 text-sm text-red-500">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-medium">Transcription failed</p>
            {transcriptionError && (
              <p className="mt-0.5 text-xs text-red-400">{transcriptionError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
