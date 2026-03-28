"use client";

import { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PRESET_COLORS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
];

export type Tag = { id: string; name: string; color: string };

export function TagPicker({
  selectedTagIds,
  onChange,
}: {
  selectedTagIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("trip_tags")
      .select("id, name, color")
      .order("name")
      .then(({ data }) => setTags(data ?? []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    onChange(
      selectedTagIds.includes(id)
        ? selectedTagIds.filter((t) => t !== id)
        : [...selectedTagIds, id]
    );
  };

  const createTag = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data, error } = await supabase
      .from("trip_tags")
      .insert({ name: newName.trim(), color: newColor, user_id: user.id })
      .select("id, name, color")
      .single();

    if (!error && data) {
      setTags((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange([...selectedTagIds, data.id]);
    }
    setCreating(false);
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    setSaving(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all"
              style={{
                backgroundColor: selected ? tag.color + "18" : "#f5f5f4",
                color: selected ? tag.color : "#78716c",
                outline: selected ? `2px solid ${tag.color}40` : "none",
                outlineOffset: "1px",
              }}
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
              {selected && <Check className="h-3 w-3" />}
            </button>
          );
        })}

        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-stone-300 px-3 py-1 text-xs text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-500"
          >
            <Plus className="h-3 w-3" />
            New tag
          </button>
        )}
      </div>

      {creating && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-stone-200 p-3">
          <input
            autoFocus
            type="text"
            placeholder="Tag name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTag()}
            className="flex-1 text-sm outline-none placeholder:text-stone-300"
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className="h-4 w-4 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  transform: newColor === c ? "scale(1.3)" : "scale(1)",
                  outline: newColor === c ? `2px solid ${c}60` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={createTag}
            disabled={!newName.trim() || saving}
            className="rounded-lg bg-[#2D323B] px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? "..." : "Add"}
          </button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName(""); }}
            className="text-stone-400 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
