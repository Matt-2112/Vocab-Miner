import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-[family-name:var(--font-geist-sans)]">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10 sticky top-0 bg-[#0d0d0d]/90 backdrop-blur-md z-50">
        <span className="text-white font-semibold text-lg tracking-tight">
          immerse<span className="text-[#4ade80]">.</span>
        </span>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/generate"
            className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors font-medium"
          >
            Get started free
          </Link>
          <AuthButton />
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[#4ade80] text-xs font-semibold tracking-widest uppercase mb-6">
            Vocabulary from your favorite shows
          </p>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] mb-6">
            Stop<br />
            guessing.<br />
            Start<br />
            <em className="not-italic font-bold italic text-white/80">understanding</em>.
          </h1>
          <p className="text-white/50 text-base leading-relaxed mb-10 max-w-sm">
            Upload any subtitle file and get a ready-to-import Anki deck with the most common words, real example sentences, and translations — in minutes.
          </p>

          {/* Upload CTA */}
          <Link
            href="/generate"
            className="group flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-[#4ade80]/50 transition-colors max-w-sm text-center"
          >
            <div className="w-8 h-8 border-2 border-white/30 rounded group-hover:border-[#4ade80]/60 transition-colors" />
            <p className="text-white/70 text-sm font-medium">Drop your .srt or .ass file here</p>
            <p className="text-white/30 text-xs">or click to browse · supports 40+ languages</p>
          </Link>
        </div>

        {/* Live demo panel */}
        <div className="hidden md:block">
          <div className="bg-[#161616] rounded-2xl border border-white/10 overflow-hidden">
            {/* Fake subtitle player */}
            <div className="bg-[#1a1a1a] border-b border-white/10 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-3 text-white/40 text-xs font-mono">Breaking Bad S01E01.srt</span>
            </div>
            <div className="p-6 space-y-5 font-mono text-sm">
              <div className="space-y-1">
                <p className="text-white/30 text-xs">00:04:22,140 → 00:04:25,080</p>
                <p className="text-white/80">
                  Tengo que{" "}
                  <mark className="bg-[#4ade80]/20 text-[#4ade80] px-0.5 rounded not-italic">conseguir</mark>{" "}
                  más precursor esta semana.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-white/30 text-xs">00:06:11,400 → 00:06:13,900</p>
                <p className="text-white/80">
                  No{" "}
                  <mark className="bg-yellow-500/20 text-yellow-400 px-0.5 rounded not-italic">puedo</mark>{" "}
                  seguir así, ¿entiendes?
                </p>
              </div>
              <p className="text-white/30 text-xs">↓ analyzed 847 lines · top 50 words extracted</p>
            </div>

            <div className="border-t border-white/10 mx-6" />

            {/* Card preview */}
            <div className="p-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/30 text-xs mb-3 uppercase tracking-wider">Front</p>
                <p className="text-2xl italic font-semibold">conseguir</p>
                <p className="text-white/40 text-xs mt-3 leading-relaxed">
                  &ldquo;Tengo que conseguir más<br />precursor esta semana.&rdquo;
                </p>
              </div>
              <div>
                <p className="text-white/30 text-xs mb-3 uppercase tracking-wider">Back</p>
                <p className="text-xl font-semibold leading-tight">to get / to<br />obtain</p>
                <p className="text-white/40 text-xs mt-3">verb · irregular</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/10 py-28">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-16">How it works</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: "01",
                title: "Upload your subtitles",
                body: "Drag in any .srt or .ass file from your downloaded media. Works with any language.",
              },
              {
                n: "02",
                title: "We extract the vocab",
                body: "Frequency analysis strips filler, finds the words that actually matter, and pulls a real example sentence for each.",
              },
              {
                n: "03",
                title: "Import and study",
                body: "Download your .apkg and import it into Anki. Cards are ready to go — no editing needed.",
              },
            ].map((step, i) => (
              <div key={step.n} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-3 left-full w-full h-px bg-white/10 -translate-x-8" />
                )}
                <p className="text-white/20 text-xs font-mono mb-4">{step.n}</p>
                <h3 className="text-lg font-semibold mb-3 italic">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "40+", label: "languages supported" },
              { value: "2 min", label: "from upload to deck" },
              { value: "50", label: "cards per deck, free" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-5xl md:text-6xl font-bold mb-2">{stat.value}</p>
                <p className="text-white/40 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-16">
            Simple. No <em className="italic">surprises</em>.
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
            {/* Free */}
            <div className="bg-[#161616] rounded-2xl border border-white/10 p-8">
              <p className="text-white/50 text-sm mb-4">Free</p>
              <p className="text-5xl font-bold mb-1">$0</p>
              <p className="text-white/30 text-sm mb-8">/month</p>
              <ul className="space-y-3 mb-10">
                {[
                  { label: "50 cards per export", active: true },
                  { label: "All languages", active: true },
                  { label: "Example sentences", active: true },
                  { label: "Unlimited cards", active: false },
                  { label: "Batch processing", active: false },
                  { label: "Saved deck history", active: false },
                ].map((item) => (
                  <li key={item.label} className={`flex items-center gap-3 text-sm ${item.active ? "text-white/70" : "text-white/25"}`}>
                    <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${item.active ? "border-white/40" : "border-white/15"}`}>
                      {item.active && <span className="w-1.5 h-1.5 rounded-sm bg-white/50" />}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
              <Link
                href="/generate"
                className="block w-full text-center border border-white/20 text-white/70 rounded-lg py-2.5 text-sm font-medium hover:border-white/40 hover:text-white transition-colors"
              >
                Start for free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#0f1f14] rounded-2xl border border-[#4ade80]/30 p-8 relative">
              <div className="absolute top-5 right-5">
                <span className="bg-[#4ade80]/20 text-[#4ade80] text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full">
                  Most popular
                </span>
              </div>
              <p className="text-white/50 text-sm mb-4">Pro</p>
              <p className="text-5xl font-bold mb-1">$7</p>
              <p className="text-white/30 text-sm mb-8">/month</p>
              <ul className="space-y-3 mb-10">
                {[
                  "Unlimited cards per export",
                  "All languages",
                  "Example sentences",
                  "Batch process entire seasons",
                  "Saved deck history",
                  "Priority processing",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                    <span className="w-4 h-4 rounded border border-[#4ade80]/50 flex items-center justify-center flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-sm bg-[#4ade80]/70" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <button className="block w-full text-center bg-[#4ade80] text-[#0d0d0d] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#22c55e] transition-colors">
                Get Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-8 flex items-center justify-between text-white/30 text-sm">
        <p>© 2025 immerse.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>

    </div>
  );
}
