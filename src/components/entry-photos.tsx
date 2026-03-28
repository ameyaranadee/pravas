"use client";

import { useState, useRef, useEffect } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const MAX_ENTRY_PHOTOS = 20;

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
  centeredControls = false,
}: {
  entryId: string;
  userId: string;
  initialPhotos: Photo[];
  centeredControls?: boolean;
}) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [optimistic, setOptimistic] = useState<OptimisticPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxUrl(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

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
      <div className={`mb-3 flex items-center justify-between ${centeredControls ? "mx-auto max-w-3xl px-6" : "px-2"}`}>
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
        <div className={`mb-3 flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ${centeredControls ? "mx-auto max-w-3xl px-6" : "mx-2"}`}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Polaroid photos on a string */}
      {allPhotos.length > 0 ? (
        <div className={`relative ${centeredControls ? "px-4" : "px-1"}`}>
          {/* The string — loose catenary curve */}
          <svg
            viewBox="0 0 1000 36"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 z-20"
            style={{ top: 0, height: "36px", width: "100%" }}
          >
            {/* shadow */}
            <path
              d="M0,5 Q500,32 1000,5"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              transform="translate(0,2)"
            />
            {/* main rope */}
            <path
              d="M0,5 Q500,32 1000,5"
              stroke="#92400e"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Scrollable photo row */}
          <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none]">
            {allPhotos.map((photo, index) => {
              const rotations = ["-rotate-2", "rotate-3", "-rotate-1", "rotate-2", "-rotate-3"];
              const rotation = rotations[index % rotations.length];
              return (
                <div
                  key={photo.id}
                  onClick={() => !isOptimistic(photo) && setLightboxUrl(photo.url)}
                  className={`group relative z-10 flex-shrink-0 bg-white px-2 pb-5 pt-10 shadow-md transition-all duration-200 hover:scale-105 hover:rotate-0 hover:z-30 hover:shadow-xl ${!isOptimistic(photo) ? "cursor-pointer" : ""} ${rotation}`}
                >
                  {/* Hole where string passes through */}
                  <div className="absolute left-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-inner ring-1 ring-gray-300" style={{ top: "5px" }} />

                  <div className="relative h-28 w-20 overflow-hidden bg-gray-100">
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
                  </div>

                  {!isOptimistic(photo) && (
                    <button
                      onClick={() => handleDelete(photo as Photo)}
                      className="absolute right-1 top-8 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-8 text-center transition-colors hover:border-gray-300 ${centeredControls ? "mx-auto max-w-3xl px-6" : ""}`}
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
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 rounded-full p-2 text-white/70 transition-colors hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxUrl}
              alt="Photo"
              width={1200}
              height={900}
              className="max-h-[90vh] w-auto rounded-lg object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
