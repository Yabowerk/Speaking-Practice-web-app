import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Mic,
} from "lucide-react";

const DEFAULT_RECENT = [
  { id: 1, date: "May 12, 2025", time: "3:42", fillerWords: 12, wpm: 128 },
  { id: 2, date: "May 9, 2025", time: "2:58", fillerWords: 15, wpm: 121 },
  { id: 3, date: "May 6, 2025", time: "4:15", fillerWords: 15, wpm: 118 },
  { id: 4, date: "May 2, 2025", time: "3:21", fillerWords: 9, wpm: 132 },
  { id: 5, date: "Apr 28, 2025", time: "3:47", fillerWords: 6, wpm: 118 },
];

const DEFAULT_OLDER = [
  { id: 6, date: "Apr 24, 2025", time: "3:05", fillerWords: 14, wpm: 116 },
  { id: 7, date: "Apr 20, 2025", time: "2:41", fillerWords: 10, wpm: 124 },
  { id: 8, date: "Apr 15, 2025", time: "3:52", fillerWords: 17, wpm: 112 },
];

export default function History({
  recentSessions = DEFAULT_RECENT,
  olderSessions = DEFAULT_OLDER,
  onBack = () => {},
  onOpenSession = () => {},
  onStartFirstSession = () => {},
}) {
  const [showOlder, setShowOlder] = useState(false);
  const isEmpty = recentSessions.length === 0;

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden min-h-[600px] sm:min-h-[640px]">
        {/* Top bar */}
        <div className="flex items-center px-5 pt-6 pb-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#241416] transition-colors hover:bg-black/5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 pb-4">
          <h1 className="font-serif text-3xl text-[#241416]">History</h1>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col">
          {isEmpty ? (
            <EmptyState onStartFirstSession={onStartFirstSession} />
          ) : (
            <>
              <SectionLabel>Recent Sessions</SectionLabel>
              <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] divide-y divide-[#E7DDD0] shadow-sm overflow-hidden">
                {recentSessions.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onClick={() => onOpenSession(session)}
                  />
                ))}
              </div>

              {olderSessions.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowOlder((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase transition-colors hover:text-[#6B5F5C]"
                  >
                    Older Sessions
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${
                        showOlder ? "rotate-180" : ""
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {showOlder && (
                    <div className="mt-3 rounded-2xl bg-white/70 border border-[#E7DDD0] divide-y divide-[#E7DDD0] shadow-sm overflow-hidden">
                      {olderSessions.map((session) => (
                        <SessionRow
                          key={session.id}
                          session={session}
                          onClick={() => onOpenSession(session)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="mb-2 text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
      {children}
    </span>
  );
}

function SessionRow({ session, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A2331] text-[#F6F1E7]">
        <Play className="h-3.5 w-3.5 fill-current ml-0.5" strokeWidth={0} />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[#241416]">
          {session.date}
        </span>
        <span className="block text-xs text-[#9B8F86]">{session.time}</span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-serif text-base text-[#241416]">
          {session.fillerWords}
        </span>
        <span className="block text-[10px] tracking-wide text-[#9B8F86] uppercase">
          Fillers
        </span>
      </span>

      <span className="shrink-0 text-right w-12">
        <span className="block font-serif text-base text-[#241416]">
          {session.wpm}
        </span>
        <span className="block text-[10px] tracking-wide text-[#9B8F86] uppercase">
          WPM
        </span>
      </span>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#C9BCB2]"
        strokeWidth={2}
      />
    </button>
  );
}

function EmptyState({ onStartFirstSession }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBEDEE] text-[#8C2E3B]">
        <Mic className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-[#6B5F5C] leading-relaxed">
        No sessions yet
        <br />
        will show up here.
      </p>
      <button
        type="button"
        onClick={onStartFirstSession}
        className="rounded-full bg-[#7A2331] px-6 py-3 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
      >
        Start Your First Session
      </button>
    </div>
  );
}
