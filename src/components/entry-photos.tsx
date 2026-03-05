"use client";

import { useState, useRef } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const MAX_ENTRY_PHOTOS = 5;

type Photo = {
  id: string;
  url: string;
  storage_path: string;
};

type OptimisticPhoto = {
  id: string; // temporary local id
  url: string; // object URL
  uploading: true;
};

type DisplayPhoto = Photo | OptimisticPhoto;

function isOptimistic(p: DisplayPhoto): p is OptimisticPhoto {
  return "uploading" in p;
}

export function EntryPhotos({
  entryId,
  userId,
  initialPhotos,
}: {
  entryId: string;
  userId: string;
  initialPhotos: Photo[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [optimistic, setOptimistic] = useState<OptimisticPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const allPhotos: DisplayPhoto[] = [...photos, ...optimistic];
  const remaining = MAX_ENTRY_PHOTOS - allPhotos.length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    const available = MAX_ENTRY_PHOTOS - allPhotos.length;
    if (available <= 0) {
      setError(`Maximum ${MAX_ENTRY_PHOTOS} photos allowed.`);
      return;
    }

    const toUpload = files.slice(0, available);
    if (files.length > available) {
      setError(`Only ${available} more photo${available === 1 ? "" : "s"} can be added.`);
    } else {
      setError(null);
    }

    const newOptimistic: OptimisticPhoto[] = toUpload.map((file) => ({
      id: `opt-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      uploading: true as const,
    }));

    setOptimistic((prev) => [...prev, ...newOptimistic]);

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const tempId = newOptimistic[i].id;
      const ext = file.name.split(".").pop() ?? "jpg";
      const storagePath = `${userId}/${entryId}/${Date.now()}.${ext}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from("entry-photos")
          .upload(storagePath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("entry-photos").getPublicUrl(storagePath);

        const { data: row, error: insertError } = await supabase
          .from("entry_photos")
          .insert({
            entry_id: entryId,
            url: publicUrl,
            storage_path: storagePath,
            created_by: userId,
          })
          .select("id, url, storage_path")
          .single();

        if (insertError) throw insertError;

        setPhotos((prev) => [...prev, row]);
        setOptimistic((prev) => prev.filter((p) => p.id !== tempId));
        URL.revokeObjectURL(newOptimistic[i].url);
      } catch (err) {
        console.error("Upload failed:", err);
        setError("Failed to upload one or more photos. Please try again.");
        setOptimistic((prev) => prev.filter((p) => p.id !== tempId));
        URL.revokeObjectURL(newOptimistic[i].url);
      }
    }
  };

  const handleDelete = async (photo: Photo) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));

    try {
      await supabase.storage.from("entry-photos").remove([photo.storage_path]);
      await supabase.from("entry_photos").delete().eq("id", photo.id);
    } catch (err) {
      console.error("Delete failed:", err);
      setPhotos((prev) => [...prev, photo]);
      setError("Failed to delete photo. Please try again.");
    }
  };

  return (
    <div>
      {/* Count badge + add button */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {allPhotos.length} / {MAX_ENTRY_PHOTOS} photos
        </span>
        {remaining > 0 && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add photos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Photo grid */}
      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {allPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100"
            >
              <Image
                src={photo.url}
                alt="Entry photo"
                fill
                className={`object-cover transition-opacity ${
                  isOptimistic(photo) ? "opacity-50" : "opacity-100"
                }`}
                unoptimized
              />
              {isOptimistic(photo) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              {!isOptimistic(photo) && (
                <button
                  onClick={() => handleDelete(photo as Photo)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8 text-center transition-colors hover:border-gray-300"
        >
          <ImagePlus className="mb-2 h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-400">Add photos</p>
          <p className="mt-0.5 text-xs text-gray-300">Up to {MAX_ENTRY_PHOTOS} photos</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
