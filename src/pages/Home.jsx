import React, { useState } from "react";
import { Play, History, Settings, Shuffle } from "lucide-react";

const TOPICS = [
  "How has technology changed the way we learn and grow?",
  "What does 'home' mean to you?",
  "Describe a risk that ended up paying off.",
  "What's a skill you wish you'd learned earlier?",
  "Talk about a place you'd love to revisit.",
];

export default function Home({
  onStartRecording = () => {},
  onOpenHistory = () => {},
  onOpenSettings = () => {},
}) {
  const [topic, setTopic] = useState(TOPICS[0]);

  const handleSurpriseMe = () => {
    let next = topic;
    while (next === topic && TOPICS.length > 1) {
      next = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    }
    setTopic(next);
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden">
        {/* Content */}
        <div className="flex-1 px-6 pt-8 sm:pt-10 pb-4 flex flex-col">
          {/* Header waveform */}
          <MiniWaveform className="block mx-auto mb-6 text-[#8C2E3B]" />

          <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.05] text-[#241416] tracking-tight text-center">
            Speaking
          
            Practice
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#6B5F5C] text-center">
            Build fluency through mindful practice.
          </p>

          {/* Topic Card */}
          <div className="mt-8 rounded-2xl bg-white/70 border border-[#E7DDD0] p-5 shadow-sm">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
              Topic Prompt
            </span>
            <p className="mt-3 font-serif text-lg sm:text-xl leading-snug text-[#241416]">
              {topic}
            </p>
         <MiniWaveform className="block mx-auto mt-4 w-max text-[#D9B8BD]" dim />

          </div>

          {/* Surprise me */}
          <button
            type="button"
            onClick={handleSurpriseMe}
            className="mt-6 inline-flex items-center justify-center gap-2 self-stretch sm:self-center sm:px-8 rounded-full border border-[#E3B9BE] bg-[#FBEDEE] py-3 text-sm font-medium text-[#8C2E3B] transition-colors hover:bg-[#F6DFE1] active:scale-[0.98]"
          >
            <Shuffle className="h-4 w-4" strokeWidth={2} />
            Surprise me
          </button>

          {/* Start Recording */}
          <button
            type="button"
            onClick={() => onStartRecording(topic)}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" strokeWidth={0} />
            Start Recording
          </button>

          <p className="mt-3 text-center text-xs text-[#9B8F86]">
            Select a topic to begin
          </p>
        </div>

        {/* Bottom nav */}
        <nav className="mt-auto border-t border-[#E7DDD0] px-6 py-4">
          <div className="flex items-center justify-center gap-10">
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-2 text-sm text-[#6B5F5C] transition-colors hover:text-[#241416]"
            >
              <History className="h-4 w-4" strokeWidth={1.75} />
              History
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-2 text-sm text-[#6B5F5C] transition-colors hover:text-[#241416]"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              Settings
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

/** Decorative waveform bars, used both in the header and inside the topic card. */
function MiniWaveform({ className = "", dim = false }) {
  const heights = [6, 12, 18, 10, 22, 14, 8, 16, 11, 20, 9, 13, 7, 17, 12, 6];
  return (
    <div className={`flex items-end gap-[3px] h-6 ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${dim ? "opacity-60" : ""}`}
          style={{ height: `${h}px`, backgroundColor: "currentColor" }}
        />
      ))}
    </div>
  );
}