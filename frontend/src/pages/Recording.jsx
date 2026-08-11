import React, { useEffect, useRef, useState } from "react";
import { Pin, Square } from "lucide-react";
export default function SpeakingPracticeRecording({
  topic = "How has technology changed the way we learn and grow?",
  autoStart = true,
  onStop = () => {},
  onDiscard = () => {},
}) {
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(autoStart);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRecording]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const handleStop = () => {
    setIsRecording(false);
    clearInterval(intervalRef.current);
    onStop(seconds);
  };

  const handleDiscard = () => {
    setIsRecording(false);
    clearInterval(intervalRef.current);
    onDiscard();
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden">
        <div className="flex-1 px-6 pt-8 sm:pt-10 pb-6 flex flex-col">
          {/* Topic pin card */}
          <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
              <Pin className="h-3 w-3" strokeWidth={2} />
              Topic
            </div>
            <p className="mt-2 font-serif text-base sm:text-lg leading-snug text-[#241416]">
              {topic}
            </p>
          </div>

          {/* Status + timer */}
          <div className="mt-10 flex flex-col items-center">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
              {isRecording ? "Recording" : "Paused"}
            </span>
            <span className="mt-2 font-serif text-5xl sm:text-6xl tabular-nums text-[#241416]">
              {mm}:{ss}
            </span>
            <LiveWaveform active={isRecording} className="mt-4 text-[#D9B8BD]" />
          </div>

          {/* Pulsing mic */}
          <div className="mt-10 flex items-center justify-center">
            <div className="relative flex items-center justify-center h-56 w-56">
              {isRecording && (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#E9B3BB] opacity-30 animate-ping-slow" />
                  <span className="absolute inline-flex h-[78%] w-[78%] rounded-full bg-[#E9A3AC] opacity-40 animate-ping-slower" />
                </>
              )}
              <span className="absolute inline-flex h-[78%] w-[78%] rounded-full bg-[#F0C7CC]" />
              <span className="absolute inline-flex h-[54%] w-[54%] rounded-full bg-[#7A2331] shadow-lg items-center justify-center">
                <MicIcon className="h-9 w-9 text-[#F6F1E7]" />
              </span>
            </div>
          </div>

          {/* Stop recording */}
          <button
            type="button"
            onClick={handleStop}
            className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
          >
            <Square className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
            Stop Recording
          </button>

          <button
            type="button"
            onClick={handleDiscard}
            className="mt-4 text-center text-sm text-[#9B8F86] underline underline-offset-2 transition-colors hover:text-[#6B5F5C]"
          >
            Discard and cancel
          </button>
        </div>
      </div>

      {/* Local keyframes for the slow pulse rings (Tailwind's default ping is too fast) */}
      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(0.85); opacity: 0.35; }
          70%, 100% { transform: scale(1); opacity: 0; }
        }
        @keyframes ping-slower {
          0% { transform: scale(0.9); opacity: 0.4; }
          70%, 100% { transform: scale(1.08); opacity: 0; }
        }
        .animate-ping-slow { animation: ping-slow 2.6s cubic-bezier(0,0,0.2,1) infinite; }
        .animate-ping-slower { animation: ping-slower 2.6s cubic-bezier(0,0,0.2,1) infinite 0.4s; }
      `}</style>
    </div>
  );
}

/** Simple filled microphone glyph (kept local so no extra icon dependency is required). */
function MicIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z"
        fill="currentColor"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 18.5V21"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Animated waveform bars — random-ish heights that move while recording is active. */
function LiveWaveform({ active = true, className = "" }) {
  const bars = [6, 12, 18, 10, 22, 14, 8, 16, 11, 20, 9, 13, 7, 17, 12, 6, 10, 15];
  return (
    <div className={`flex items-end gap-[3px] h-6 ${className}`} aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-current ${active ? "animate-bar" : ""}`}
          style={{
            height: `${h}px`,
            animationDelay: `${i * 0.06}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bar-bounce {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1.3); }
        }
        .animate-bar { animation: bar-bounce 0.9s ease-in-out infinite; transform-origin: bottom; }
      `}</style>
    </div>
  );
}


