"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AddWrittenLog({ entryId }: { entryId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("entries")
        .update({ journal_text: text.trim() })
        .eq("id", entryId);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error("Save failed:", err);
      setSaving(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-stone-200 px-4 py-3 text-sm text-stone-400 transition-colors hover:border-stone-300 hover:text-stone-500 w-full"
      >
        <PenLine className="h-4 w-4 flex-shrink-0" />
        Add a written log
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
        Written log
      </p>
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your log here..."
        rows={5}
        className="w-full resize-none text-base leading-8 text-[#2D323B] placeholder:text-stone-300 outline-none"
      />
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          onClick={() => { setExpanded(false); setText(""); }}
          disabled={saving}
          className="rounded-lg px-3 py-1.5 text-sm text-stone-400 transition-colors hover:text-stone-600 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={!text.trim() || saving}
          className="rounded-lg bg-[#2D323B] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
