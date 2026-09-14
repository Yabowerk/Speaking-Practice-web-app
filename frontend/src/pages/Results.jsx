import React, { useState, useEffect, useContext, useRef } from "react";
import { ChevronLeft, MoreHorizontal, Play, CloudOff, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { AudioPlayer } from "../Components/AudioPlayer";
import { useTranslation } from "react-i18next";
import ReactMarkdown from 'react-markdown';





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


const FILLER_WORDS = ["um", "uh", "like", "you know", "so", "actually"];

function buildTranscriptChunks(text) {
  if (!text) return [];

  const pattern = new RegExp(`\\b(${FILLER_WORDS.join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return parts
    .filter((part) => part !== "")
    .map((part) => {
      const isFiller = FILLER_WORDS.some(
        (f) => f.toLowerCase() === part.toLowerCase()
      );
      return { text: part, filler: isFiller };
    });
}




export default function Results({
  status = "populated", // 'loading' | 'error' | 'populated'
  result = DEFAULT_RESULT,
  onBack,
  onRetry = () => { },
  onNewSession = () => { },
}) {
  const navigate = useNavigate();
  const handleBack = onBack || (() => {
    navigate("/history");
  });

  const { serverdata, setServerdata } = useContext(AppContext);
  useEffect((
  ) => {// console.log(serverdata);

  },
    []);

  const { t } = useTranslation();

  return (

    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden min-h-[600px] sm:min-h-[640px]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#241416] transition-colors hover:bg-black/5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="font-serif text-lg text-[#241416]">{t("Results")}</h1>
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
            <PopulatedState serverdata={serverdata} onNewSession={onNewSession} />
          )}
        </div>
      </div>
    </div>
  );
}



function ErrorState({ onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBEDEE] text-[#8C2E3B]">
        <CloudOff className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="text-sm text-[#6B5F5C] leading-relaxed">
        {t("We couldn't load your results")}
        <br />
        {t("right now. Let's try again.")}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-[#7A2331] px-8 py-3 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
      >
        {t("Retry")}
      </button>
    </div>
  );
}

function PopulatedState({ serverdata, onNewSession }) {
  const navigate = useNavigate();
  const transcriptChunks = buildTranscriptChunks(serverdata.transcript);
  function newsession() {
    navigate("/recording");
  }

  function newsession() {
    navigate("/recording");
  }
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col">
      <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] p-4 shadow-sm">
        {/* Session meta + play */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#241416]">
            {serverdata.date} &middot; {serverdata.time}
          </span>
        </div>
        {/* Topic */}
        {serverdata.topic && (
          <div className="mt-4">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
              {t("Topic")}
            </span>
            <p className="mt-1.5 font-serif text-base leading-snug text-[#241416]">
              {serverdata.topic}
            </p>
          </div>
        )}

        <AudioPlayer serverdata={serverdata} />

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F6F1E7] px-4 py-3">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
              {t("Filler Words")}
            </span>
            <p className="mt-1 font-serif text-2xl text-[#241416]">
              {serverdata.fillerWords}
            </p>
          </div>
          <div className="rounded-xl bg-[#F6F1E7] px-4 py-3">
            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
              {t("Average WPM")}
            </span>
            <p className="mt-1 font-serif text-2xl text-[#241416]">
              {serverdata.avgWpm}
            </p>
          </div>
        </div>

        {/* Transcript */}
        <div className="mt-5">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-[#9B8F86] uppercase">
            {t("Transcript")}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-[#3A2E2C]">
            {transcriptChunks.map((chunk, i) =>
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
            {t("Tip")}
          </span>
          <p className="prose prose-sm max-w-none mt-1 text-[#5C1D28]">
            <ReactMarkdown> {serverdata.ai || t("Nice work — keep practicing to smooth out your pacing.")}</ReactMarkdown>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={newsession}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
      >
        {t("New Session")}
      </button>
    </div>
  );
}


