"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plane } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black">
            <Plane className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Pravas
            </h1>
            <p className="mt-1 text-sm text-gray-500">Your travel diary</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-3 text-3xl">✉️</div>
            <h2 className="mb-2 text-base font-semibold text-gray-900">
              Check your email
            </h2>
            <p className="text-sm text-gray-500">
              We sent a magic link to{" "}
              <span className="font-medium text-gray-700">{email}</span>. Click
              it to sign in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-5 text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
          >
            <h2 className="mb-6 text-base font-semibold text-gray-900">
              Sign in to continue
            </h2>

            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400"
              />
            </div>

            {error && (
              <p className="mb-4 text-xs text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Continue with Email"}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              We&apos;ll send you a magic link — no password needed.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
