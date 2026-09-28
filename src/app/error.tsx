"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <section className="w-full max-w-xl rounded-2xl border border-red-400/20 bg-white/[0.04] p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
          AGE Trade Intelligence
        </p>
        <h1 className="mt-3 text-2xl font-semibold">This investigation could not be displayed.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The underlying source may have returned incomplete data. AGE does not
          treat missing fields as verified facts. Try the investigation again.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
