"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Pause, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type RecorderState = "idle" | "recording" | "paused" | "stopped";

export function AddAudioLog({ entryId }: { entryId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (state === "recording") {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const saveRecording = async (blob: Blob) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("trip-audio")
        .upload(fileName, blob, { contentType: "audio/webm" });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("trip-audio")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("entries")
        .update({
          audio_url: publicUrl,
          audio_mime: "audio/webm",
          transcription_status: "pending",
        })
        .eq("id", entryId);
      if (updateError) throw updateError;

      fetch(`/api/entries/${entryId}/transcribe`, { method: "POST" }).catch(
        (err) => console.error("Transcription trigger failed:", err),
      );

      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        saveRecording(blob);
      };

      mr.start();
      setState("recording");
      setElapsed(0);
    } catch (err) {
      console.error("Microphone error:", err);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      mediaRecorderRef.current.stop();
      setState("stopped");
    }
  };

  const cancel = () => {
    if (mediaRecorderRef.current && state !== "idle") {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    setState("idle");
    setElapsed(0);
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-500 w-full"
      >
        <Mic className="h-4 w-4 flex-shrink-0" />
        Add a recording
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-stone-400">
        Audio log
      </p>

      <div className="flex items-center gap-4">
        {/* Status indicator */}
        {state === "idle" && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
            <Mic className="h-5 w-5 text-stone-400" />
          </div>
        )}
        {state === "recording" && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
          </div>
        )}
        {state === "paused" && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <Pause className="h-4 w-4 text-yellow-600" />
          </div>
        )}
        {(state === "stopped" || saving) && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <div className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />
          </div>
        )}

        {/* Timer / status text */}
        <div className="flex-1">
          {state === "idle" && (
            <p className="text-sm text-stone-400">Tap to start recording</p>
          )}
          {(state === "recording" || state === "paused") && (
            <div>
              <p className="tabular-nums text-sm font-semibold">{formatTime(elapsed)}</p>
              <p className="text-xs text-stone-400">{state === "paused" ? "Paused" : "Recording..."}</p>
            </div>
          )}
          {saving && (
            <p className="text-sm text-stone-400">Saving recording...</p>
          )}
        </div>

        {/* Controls */}
        {state === "idle" && (
          <div className="flex items-center gap-2">
            <button
              onClick={cancel}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-400 transition-colors hover:text-stone-600"
            >
              Cancel
            </button>
            <button
              onClick={startRecording}
              className="flex items-center gap-2 rounded-xl bg-[#2D323B] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
            >
              <Mic className="h-4 w-4" />
              Record
            </button>
          </div>
        )}
        {(state === "recording" || state === "paused") && (
          <div className="flex items-center gap-2">
            {state === "recording" ? (
              <button
                onClick={pauseRecording}
                aria-label="Pause"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50"
              >
                <Pause className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                aria-label="Resume"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 text-stone-600 transition-colors hover:bg-stone-50"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              <Square className="h-4 w-4 fill-white" />
              Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
