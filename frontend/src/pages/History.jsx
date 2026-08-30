import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Mic,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase";
import { AppContext } from "../context/AppContext";

// ─── helpers ───────────────────────────────────────────────────────────────
const GOAL_HOURS = 20;

function computeStats(allSessions) {
  // Total practice time in hours (1 decimal)
  const totalSeconds = allSessions.reduce(
    (acc, s) => acc + (s.raw.duration_seconds || 0),
    0
  );
  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

  // Build last-10-days daily minutes map
  const today = new Date();
  const days = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toDateString(); // e.g. "Sun Aug 11 2024"
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // "Aug 11"
    days.push({ key, label, minutes: 0 });
  }

  allSessions.forEach((s) => {
    const date = new Date(s.raw.created_at).toDateString();
    const bucket = days.find((d) => d.key === date);
    if (bucket) {
      bucket.minutes += (s.raw.duration_seconds || 0) / 60;
    }
  });

  // Round to 1 decimal
  const dailyMinutes = days.map((d) => ({
    label: d.label,
    minutes: Math.round(d.minutes * 10) / 10,
  }));

  return { totalHours, goalHours: GOAL_HOURS, dailyMinutes };
}

export default function History() {
  const { setServerdata } = useContext(AppContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [olderSessions, setOlderSessions] = useState([]);
  const [showOlder, setShowOlder] = useState(false);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    console.log(i18n.language);
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:3000/sessions/${i18n.language}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }

        const rawSessions = await response.json();
        console.log(rawSessions);

        // Parse and format sessions
        const formattedSessions = rawSessions.map(session => {
          const createdDate = new Date(session.created_at || Date.now());

          // Format date as "MMM DD, YYYY" (e.g. "May 12, 2025")
          const dateStr = createdDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          // Format duration_seconds as "M:SS"
          const duration = session.duration_seconds || 0;
          const mins = Math.floor(duration / 60);
          const secs = Math.round(duration % 60);
          const timeStr = `${mins}:${String(secs).padStart(2, "0")}`;

          return {
            id: session.id,
            date: dateStr,
            time: timeStr,
            fillerWords: session.filler_count || 0,
            wpm: session.avg_wpm || 0,
            raw: session // keep raw session to pass to Results
          };
        });

        // Group into recent (last 7 days) and older
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recent = [];
        const older = [];

        formattedSessions.forEach(session => {
          const sessionDate = new Date(session.raw.created_at);
          if (sessionDate >= sevenDaysAgo) {
            recent.push(session);
          } else {
            older.push(session);
          }
        });

        setRecentSessions(recent);
        setOlderSessions(older);
      } catch (err) {
        console.error(err);
        setError("Could not load history");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const onBack = () => {
    navigate("/");
  };

  const onStartFirstSession = () => {
    navigate("/Recording");
  };

  const onOpenSession = (formattedSession) => {
    const raw = formattedSession.raw;
    const createdDate = new Date(raw.created_at);
    // Setup serverdata in AppContext
    setServerdata({
      date: createdDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: createdDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      duration: raw.duration_seconds,
      fillerWords: raw.filler_count,
      avgWpm: raw.avg_wpm,
      transcript: raw.transcript,
      audio_url: raw.audio_url,
      ai: raw.ai_advice,
      topic: raw.topic_prompt
    });
    navigate("/results");
  };

  const isEmpty = recentSessions.length === 0 && olderSessions.length === 0;

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
          <h1 className="font-serif text-3xl text-[#241416]">{t("History")}</h1>
        </div>

        <div className="flex-1 px-5 pb-8 flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
              <span className="h-9 w-9 rounded-full border-[3px] border-[#E7DDD0] border-t-[#7A2331] animate-spin" />
              <p className="text-sm text-[#6B5F5C] leading-relaxed">
                {t("Loading history...")}
              </p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
              <p className="text-sm text-[#8C2E3B] leading-relaxed font-semibold">
                {t(error)}
              </p>
            </div>
          ) : isEmpty ? (
            <EmptyState onStartFirstSession={onStartFirstSession} />
          ) : (
            <>
              {/* ── Progress stats widget ── */}
              <ProgressStats
                stats={computeStats([...recentSessions, ...olderSessions])}
              />

              {recentSessions.length > 0 && (
                <>
                  <SectionLabel>{t("Recent Sessions")}</SectionLabel>
                  <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] divide-y divide-[#E7DDD0] shadow-sm overflow-hidden mb-4">
                    {recentSessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        onClick={() => onOpenSession(session)}
                      />
                    ))}
                  </div>
                </>
              )}

              {olderSessions.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowOlder((v) => !v)}
                    className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase transition-colors hover:text-[#6B5F5C] mb-2"
                  >
                    {t("Older Sessions")}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${showOlder ? "rotate-180" : ""
                        }`}
                      strokeWidth={2}
                    />
                  </button>

                  {showOlder && (
                    <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] divide-y divide-[#E7DDD0] shadow-sm overflow-hidden">
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

// ─── ProgressStats ─────────────────────────────────────────────────────────
function ProgressStats({ stats }) {
  const { totalHours, goalHours, dailyMinutes } = stats;
  const pct = Math.min((totalHours / goalHours) * 100, 100);
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex flex-col gap-3">
      {/* Card 1 — Total Practice Time */}
      <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] shadow-sm px-5 py-4">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-black uppercase mb-2">
          {t("Total Practice Time")}
        </p>
        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="font-serif text-[2.6rem] leading-none text-[#241416]">
            {totalHours}
          </span>
          <span className="text-sm text-black">
            {t("of")} {goalHours} {t("hours")}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-[#E7DDD0] overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-[#7A2331] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[12px] text-[#9B8F86] italic leading-relaxed text-center">
          {t("It takes about 20 hours of practice to become noticeably more fluent.")}
          <br />

          {t("You're building that time now")}
        </p>
      </div>

      {/* Card 2 — Minutes Practiced Per Day */}
      <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] shadow-sm px-5 pt-4 pb-3">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-black uppercase mb-4">
          {t("Minutes Practiced Per Day")}
        </p>
        <DailyBarChart data={dailyMinutes} />

      </div>
    </div>
  );
}

// ─── DailyBarChart ──────────────────────────────────────────────────────────
function DailyBarChart({ data }) {
  const [hoveredLabel, setHoveredLabel] = React.useState(null);

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  // Round up to nearest 5 for a clean Y-axis ceiling
  const yMax = Math.ceil(maxMinutes / 5) * 5 || 5;
  const yTicks = [0, yMax / 3, (2 * yMax) / 3, yMax].map((v) =>
    Math.round(v)
  );

  const BAR_HEIGHT = 96; // px — the drawable area height

  return (
    <div className="flex gap-1 items-end" style={{ minHeight: `${BAR_HEIGHT + 28}px` }}>
      {/* Y-axis */}
      <div
        className="flex flex-col-reverse justify-between shrink-0 pr-1"
        style={{ height: `${BAR_HEIGHT}px` }}
      >
        {yTicks.map((v) => (
          <span key={v} className="text-[9px] text-[#C9BCB2] leading-none">
            {v}
          </span>
        ))}
      </div>

      {/* Bars + labels */}
      <div className="flex flex-1 items-end gap-[3px]">
        {data.map(({ label, minutes }) => {
          const heightPct = (minutes / yMax) * 100;
          const isHovered = hoveredLabel === label;
          // Format tooltip: show "Xm Ys" or "Xm" or "Ys"
          const totalSecs = Math.round(minutes * 60);
          const m = Math.floor(totalSecs / 60);
          const s = totalSecs % 60;
          const tooltipText =
            m > 0 && s > 0 ? `${m}m ${s}s` : m > 0 ? `${m}m` : `${s}s`;

          return (
            <div
              key={label}
              className="flex flex-col items-center flex-1 gap-1"
              onMouseEnter={() => minutes > 0 && setHoveredLabel(label)}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              {/* Bar column */}
              <div
                className="w-full relative flex items-end"
                style={{ height: `${BAR_HEIGHT}px` }}
              >
                {/* Grid lines */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col-reverse justify-between pointer-events-none">
                  {yTicks.slice(1).map((v) => (
                    <div key={v} className="w-full border-t border-[#E7DDD0]" />
                  ))}
                </div>

                {/* Actual bar */}
                {minutes > 0 && (
                  <div
                    className={`relative w-full rounded-t-sm transition-all duration-300 ${isHovered ? "bg-[#5C1A25]" : "bg-[#7A2331]"
                      }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Tooltip */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 pointer-events-none"
                      style={{
                        opacity: isHovered ? 1 : 0,
                        transform: `translateX(-50%) translateY(${isHovered ? "0px" : "4px"})`,
                        transition: "opacity 0.15s ease, transform 0.15s ease",
                      }}
                    >
                      <span className="whitespace-nowrap rounded-md bg-[#241416] px-2 py-1 text-[9px] font-semibold text-[#F6F1E7] shadow-md">
                        {tooltipText}
                      </span>
                      {/* Arrow */}
                      <span
                        className="block mx-auto mt-0.5"
                        style={{
                          width: 0,
                          height: 0,
                          borderLeft: "4px solid transparent",
                          borderRight: "4px solid transparent",
                          borderTop: "4px solid #241416",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* X-axis label — rotated */}
              <span
                className="text-[8px] text-[#9B8F86] leading-none"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  height: "24px",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <span className="mb-2 block text-[11px] font-semibold tracking-[0.14em] text-black uppercase">
      {children}
    </span>
  );
}

function SessionRow({ session, onClick }) {
  const { t } = useTranslation();
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
          {t("Fillers")}
        </span>
      </span>

      <span className="shrink-0 text-right w-12">
        <span className="block font-serif text-base text-[#241416]">
          {session.wpm}
        </span>
        <span className="block text-[10px] tracking-wide text-[#9B8F86] uppercase">
          {t("WPM")}
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
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBEDEE] text-[#8C2E3B]">
        <Mic className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-[#6B5F5C] leading-relaxed">
        {t("No sessions yet")}
        <br />
        {t("will show up here.")}
      </p>
      <button
        type="button"
        onClick={onStartFirstSession}
        className="rounded-full bg-[#7A2331] px-6 py-3 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
      >
        {t("Start Your First Session")}
      </button>
    </div>
  );
}
