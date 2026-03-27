"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const features = [
  {
    emoji: "🎙️",
    title: "Voice diaries",
    description: "Just speak. Pravas captures every thought on the go.",
  },
  {
    emoji: "✨",
    title: "Auto-transcribed",
    description: "Your recordings become readable entries instantly.",
  },
  {
    emoji: "📸",
    title: "Photo memories",
    description: "Attach photos and relive moments exactly as they were.",
  },
];

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/dashboard");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetStarted = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white py-4 font-sans text-[#2D323B]">
      {/* Navbar */}
      <header className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
        <span className="text-sm font-medium tracking-tight">pravas</span>
        <button
          onClick={handleGetStarted}
          disabled={loading}
          className="rounded-full bg-[#2D323B] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Get started"}
        </button>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-16 pt-12 text-center">
        <Image
          src="/pravas.png"
          alt="Pravas"
          height={72}
          width={200}
          className="mb-10 object-contain"
        />

        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Every{" "}
          <span className="bg-[#8B9A47]/20 px-1 text-[#6B7A30]">journey</span>,
          <br />
          beautifully remembered.
        </h1>

        <p className="mb-8 max-w-sm text-[15px] leading-relaxed text-stone-500">
          Pravas is your travel diary — record voice notes, attach photos, and
          revisit your adventures whenever you want.
        </p>

        <button
          onClick={handleGetStarted}
          disabled={loading}
          className="rounded-full bg-[#2D323B] px-7 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Start your diary →"}
        </button>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-3xl px-6">
        <hr className="border-stone-200" />
      </div>

      {/* Features */}
      <section className="mx-auto grid max-w-3xl grid-cols-3 gap-8 px-6 py-8 text-center">
        {features.map((f) => (
          <div key={f.title}>
            <div className="mb-3 text-3xl">{f.emoji}</div>
            <p className="mb-1 text-sm font-semibold">{f.title}</p>
            <p className="text-sm leading-relaxed text-stone-500">
              {f.description}
            </p>
          </div>
        ))}
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-3xl px-6">
        <hr className="border-stone-200" />
      </div>

      {/* Footer */}
      <footer className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6 text-xs text-stone-400">
        <span>© 2026 Pravas</span>
        <span>Your travel diary</span>
      </footer>
    </div>
  );
}
