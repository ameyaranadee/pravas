"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

type Tab = "mr" | "en";

export function TranscriptTabs({
  transcriptMr,
  transcriptEn,
}: {
  transcriptMr: string;
  transcriptEn: string;
}) {
  const [active, setActive] = useState<Tab>("mr");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setActive("mr")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            active === "mr"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          मराठी
        </button>
        <button
          onClick={() => setActive("en")}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
            active === "en"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          English
        </button>
      </div>

      {/* Tab content */}
      <p className="leading-relaxed text-gray-900">
        {active === "mr" ? transcriptMr : transcriptEn}
      </p>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle className="h-3.5 w-3.5" />
        Transcription complete
      </div>
    </div>
  );
}
