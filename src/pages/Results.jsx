import React, { useState } from "react";
import { ChevronLeft, MoreHorizontal, Play, CloudOff } from "lucide-react";

const DEFAULT_RESULT = {
  date: "May 12, 2025",
  time: "3:47",
  duration: "01:63",
  fillerWords: 12,
  avgWpm: 128,
  transcript: [
    { text: "Technology has greatly ", filler: false },
    { text: "um", filler: true },
    { text: " transformed ", filler: false },
    { text: "the way we learn. For example, it gives us access to so many resources ", filler: false },
    { text: "umm", filler: true },
    { text: " anytime we need them, and it also connected us with ", filler: false },
    { text: "like", filler: true },
    { text: " people who can collaborate more easily. Overall, it has ", filler: false },
    { text: "you know", filler: true },
    { text: " made learning more flexible and ", filler: false },
    { text: "so", filler: true },
    { text: " engaging.", filler: false },
  ],
  tip: "Great insights! Try pausing briefly before key points to reduce fillers like \"um\" and \"you know.\"",
};

export default function Results({
  status = "populated", // 'loading' | 'error' | 'populated'
  result = DEFAULT_RESULT,
  onBack = () => {},
  onRetry = () => {},
  onNewSession = () => {},
}) {
  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden min-h-[600px] sm:min-h-[640px]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#241416] transition-colors hover:bg-black/5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="font-serif text-lg text-[#241416]">Results</h1>
          {status === "populated" ? (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#241416] transition-colors hover:bg-black/5"
              aria-label="More options"
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
            </button>
          ) : (
            <span className="h-8 w-8" />
          )}
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col">
          {status === "loading" && <LoadingState />}
          {status === "error" && <ErrorState onRetry={onRetry} />}
          {status === "populated" && (
            <PopulatedState result={result} onNewSession={onNewSession} />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
      <span className="h-9 w-9 rounded-full border-[3px] border-[#E7DDD0] border-t-[#7A2331] animate-spin" />
      <p className="text-sm text-[#6B5F5C] leading-relaxed">
        Transcribing your session.
        <br />
        This can take up to 30 seconds.
      </p>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBEDEE] text-[#8C2E3B]">
        <CloudOff className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-[#6B5F5C] leading-relaxed">
        We couldn&apos;t load your results
        <br />
        right now. Let&apos;s try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-[#7A2331] px-8 py-3 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
      >
        Retry
      </button>
    </div>
  );
}

function PopulatedState({ result, onNewSession }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] p-4 shadow-sm">
        {/* Session meta + play */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#241416]">
            {result.date} &middot; {result.time}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A2331] text-[#F6F1E7] transition-colors hover:bg-[#6A1E2A]"
            aria-label="Play recording"
          >
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" strokeWidth={0} />
          </button>
          <PlaybackWaveform className="flex-1 text-[#D9B8BD]" />
          <span className="shrink-0 text-xs tabular-nums text-[#9B8F86]">
            {result.duration}
          </span>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F6F1E7] px-4 py-3">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
              Filler Words
            </span>
            <p className="mt-1 font-serif text-2xl text-[#241416]">
              {result.fillerWords}
            </p>
          </div>
          <div className="rounded-xl bg-[#F6F1E7] px-4 py-3">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
              Average WPM
            </span>
            <p className="mt-1 font-serif text-2xl text-[#241416]">
              {result.avgWpm}
            </p>
          </div>
        </div>

        {/* Transcript */}
        <div className="mt-5">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
            Transcript
          </span>
          <p className="mt-2 text-sm leading-relaxed text-[#3A2E2C]">
            {result.transcript.map((chunk, i) =>
              chunk.filler ? (
                <mark
                  key={i}
                  className="rounded bg-[#F3D9A9] px-0.5 text-[#6B4A16]"
                >
                  {chunk.text}
                </mark>
              ) : (
                <React.Fragment key={i}>{chunk.text}</React.Fragment>
              )
            )}
          </p>
        </div>

        {/* Tip */}
        <div className="mt-4 rounded-xl bg-[#FBEDEE] border border-[#E3B9BE] px-4 py-3">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-[#8C2E3B] uppercase">
            Tip
          </span>
          <p className="mt-1 text-sm leading-relaxed text-[#5C1D28]">
            {result.tip}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNewSession}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
      >
        New Session
      </button>
    </div>
  );
}

/** Static waveform used behind the playback scrubber. */
function PlaybackWaveform({ className = "" }) {
  const bars = [4, 8, 12, 6, 14, 9, 5, 11, 7, 13, 6, 10, 4, 8, 12, 6, 9, 5, 11, 7, 13, 8, 4, 10];
  return (
    <div className={`flex items-center gap-[2px] h-4 ${className}`} aria-hidden="true">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-current"
          style={{ height: `${h}px`, opacity: i < 9 ? 1 : 0.45 }}
        />
      ))}
    </div>
  );
}