"use client";

import { useState } from "react";
import { PenLine, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function WriteEntryBar({ tripId }: { tripId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: entry, error } = await supabase
        .from("entries")
        .insert({
          trip_id: tripId,
          entry_date: new Date().toISOString().split("T")[0],
          transcription_status: "none",
          journal_text: text.trim(),
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      router.push(`/trips/${tripId}/entries/${entry.id}`);
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  };

  const close = () => {
    setShowModal(false);
    setText("");
  };

  return (
    <>
      <div className="flex items-center gap-4 rounded-2xl border border-stone-200 px-5 py-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <PenLine className="h-5 w-5 text-gray-400" />
          </div>
          <span className="text-sm text-gray-400">
            Or write a journal entry
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-[#2D323B] transition-colors hover:bg-stone-50"
        >
          <PenLine className="h-4 w-4" />
          Write
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2D323B]">
                Journal Entry
              </h2>
              <button
                onClick={close}
                className="rounded-full p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind..."
              rows={6}
              className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm text-[#2D323B] placeholder:text-stone-300 outline-none focus:border-stone-400"
            />
            <button
              onClick={save}
              disabled={!text.trim() || saving}
              className="mt-3 w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
