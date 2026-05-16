import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center bg-void-black px-4 text-center sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-pulse-cyan/40 sm:tracking-[0.3em]">
        Error 404
      </p>
      <h1 className="mt-4 font-headline text-4xl font-bold uppercase tracking-[0.08em] text-neural-white sm:tracking-[0.1em] md:text-6xl">
        Signal Lost.
      </h1>
      <p className="mt-4 font-body leading-relaxed text-neural-white/40">
        Your agent looked everywhere. This path does not exist.
      </p>
      <Link
        href="/"
        className="mt-8 border border-pulse-cyan bg-pulse-cyan/10 px-6 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-pulse-cyan transition-all hover:bg-pulse-cyan/20 sm:tracking-[0.2em]"
      >
        Return to Base
      </Link>
    </div>
  );
}
