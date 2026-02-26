"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Pause, Play, X, Plus, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Trip = {
  id: string;
  title: string;
};

type RecorderState = "idle" | "recording" | "paused" | "stopped";

export function RecorderBar({ trips }: { trips: Trip[] }) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [creatingTrip, setCreatingTrip] = useState(false);
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
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
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        setShowModal(true);
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
    if (
      mediaRecorderRef.current &&
      (state === "recording" || state === "paused")
    ) {
      mediaRecorderRef.current.stop();
      setState("stopped");
    }
  };

  const handleSaveToTrip = async (tripId: string) => {
    if (!audioBlob) return;
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("trip-audio")
        .upload(fileName, audioBlob, { contentType: "audio/webm" });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-audio").getPublicUrl(fileName);

      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .insert({
          trip_id: tripId,
          audio_url: publicUrl,
          audio_mime: "audio/webm",
          entry_date: new Date().toISOString().split("T")[0],
          transcription_status: "pending",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (entryError) throw entryError;

      router.push(`/trips/${tripId}/entries/${entry.id}`);
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  };

  const handleCreateNewTrip = async () => {
    if (!newTripName.trim() || !audioBlob) return;
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert({ title: newTripName.trim(), created_by: user.id })
        .select()
        .single();

      if (tripError) throw tripError;

      await handleSaveToTrip(trip.id);
    } catch (err) {
      console.error("Create trip failed:", err);
      setSaving(false);
      setCreatingTrip(false);
    }
  };

  const discard = () => {
    setAudioBlob(null);
    setShowModal(false);
    setState("idle");
    setElapsed(0);
    setNewTripName("");
    setCreatingTrip(false);
    setSaving(false);
  };

  return (
    <>
      {/* Recorder Bar */}
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
        {state === "idle" && (
          <>
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Mic className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-sm text-gray-400">
                Tap to record a new memory
              </span>
            </div>
            <button
              onClick={startRecording}
              className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <Mic className="h-4 w-4" />
              Record
            </button>
          </>
        )}

        {(state === "recording" || state === "paused") && (
          <>
            <div className="flex flex-1 items-center gap-3">
              {state === "recording" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                  <Pause className="h-4 w-4 text-yellow-600" />
                </div>
              )}
              <div>
                <p className="tabular-nums text-sm font-semibold text-gray-900">
                  {formatTime(elapsed)}
                </p>
                <p className="text-xs text-gray-400">
                  {state === "paused" ? "Paused" : "Recording..."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {state === "recording" ? (
                <button
                  onClick={pauseRecording}
                  aria-label="Pause"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Pause className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  aria-label="Resume"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
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
          </>
        )}
      </div>

      {/* Save to Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Save Recording
              </h2>
              <button
                onClick={discard}
                className="rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Which trip should this recording belong to?
            </p>

            <div className="mb-4 max-h-56 space-y-2 overflow-y-auto">
              {trips.map((trip) => (
                <button
                  key={trip.id}
                  onClick={() => handleSaveToTrip(trip.id)}
                  disabled={saving}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-600">
                    {trip.title.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {trip.title}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>

            {creatingTrip ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Trip name..."
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNewTrip()}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleCreateNewTrip}
                  disabled={!newTripName.trim() || saving}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingTrip(true)}
                disabled={saving}
                className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-3 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Create new trip</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
