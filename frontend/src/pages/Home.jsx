import React, { useState, useEffect, useRef } from "react";
import { Play, History, Settings, Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import supabase from "../lib/supabase";
import { useTranslation } from "react-i18next";

const FALLBACK_TOPICS = [
  "Describe a decision you made recently that changed your perspective.",
  "Explain a complex topic you understand well to a beginner.",
  "Talk about a challenge you faced while learning or building something, and how you got through it.",
  "What is a personal habit you want to build this year and why?",
];

export default function Home({
  onStartRecording,
  onOpenHistory = () => { },
  onOpenSettings = () => { },
}) {
  const navigate = useNavigate();
  const url = import.meta.env.VITE_API_URL;
  const { t, i18n } = useTranslation();

  const [topics, setTopics] = useState(() => {
    const saved = localStorage.getItem(`practice_topics_${i18n.language}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Failed to parse practice_topics from localStorage", e);
      }
    }
    return FALLBACK_TOPICS.slice(1);
  });

  const [currentTopic, setCurrentTopic] = useState(() => {
    const savedCurrent = localStorage.getItem(`current_topic_${i18n.language}`);
    return savedCurrent || FALLBACK_TOPICS[0];
  });

  const [isLoading, setIsLoading] = useState(false);
  const isFetchingRef = useRef(false); // guards against duplicate fetches

  useEffect(() => {
    localStorage.setItem(`practice_topics_${i18n.language}`, JSON.stringify(topics));
  }, [topics, i18n.language]);

  useEffect(() => {
    localStorage.setItem(`current_topic_${i18n.language}`, currentTopic);
  }, [currentTopic, i18n.language]);

  useEffect(() => {
    const savedTopics = localStorage.getItem(`practice_topics_${i18n.language}`);
    const savedCurrent = localStorage.getItem(`current_topic_${i18n.language}`);

    let langTopics = [];
    if (savedTopics) {
      try {
        const parsed = JSON.parse(savedTopics);
        if (Array.isArray(parsed)) langTopics = parsed;
      } catch (e) { }
    }

    setTopics(langTopics);
    setCurrentTopic(savedCurrent || langTopics[0] || "");
  }, [i18n.language]);

  const fetchNextBatch = async (currentTopicsList = topics, currentActiveTopic = currentTopic) => {
    if (isFetchingRef.current) return; // already fetching, skip
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      // Pass the current topics to exclude to prevent duplicate generation
      const exclude = [...currentTopicsList];
      if (currentActiveTopic) {
        exclude.push(currentActiveTopic);
      }

      const res = await fetch(`${url}/api/${i18n.language}/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ exclude }),
      });
      const result = await res.json();
      //console.log(result);

      if (result.topics?.length) {
        setTopics((prev) => [...prev, ...result.topics]);
        if (!currentActiveTopic) {
          setCurrentTopic(result.topics[0]);
        }
      }
    } catch (err) {
      //console.error("Failed to fetch fresh topics:", err);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Background fetch effect: automatically refill when the queue drops low (<= 3 items)
  useEffect(() => {
    if (topics.length <= 3 && !isFetchingRef.current) {
      fetchNextBatch(topics, currentTopic);
    }
  }, [topics.length]);

  const getNextTopic = () => {
    if (topics.length > 0) {
      const next = topics[0];
      setTopics(topics.slice(1));
      setCurrentTopic(next);
    } else {
      // Queue is completely empty, try fetching immediately
      fetchNextBatch(topics, currentTopic);
    }
  };

  const handleStartRecording = () => {
    if (onStartRecording) {
      onStartRecording(currentTopic);
    } else {
      navigate("/recording", { state: { topic: currentTopic } });
    }
  };

  function historyx() {
    navigate("/history");
  }
  const toggleLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden">
        {/* Content */}
        <div className="flex-1 px-6 pt-8 sm:pt-10 pb-4 flex flex-col">
          {/* Header waveform */}
          <MiniWaveform className="block mx-auto mb-6 text-[#8C2E3B]" />

          <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.05] text-[#241416] tracking-tight text-center">
            {t("Speaking Practice"
            )}


          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#6B5F5C] text-center">
            {t("Build fluency through mindful practice.")}
          </p>

          {/* Topic Card */}
          <div className="mt-8 rounded-2xl bg-white/70 border border-[#E7DDD0] p-5 shadow-sm">
            <span className="text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
              {t("Topic Prompt")}
            </span>
            <p className="mt-3 font-serif text-lg sm:text-xl leading-snug text-[#241416]">
              {currentTopic}
            </p>
            <MiniWaveform className="block mx-auto mt-4 w-max text-[#D9B8BD]" dim />

          </div>

          {/* Surprise me */}
          <button
            type="button"
            onClick={getNextTopic} disabled={isLoading && topics.length === 0}
            className="mt-6 inline-flex items-center justify-center gap-2 self-stretch sm:self-center sm:px-8 rounded-full border border-[#E3B9BE] bg-[#FBEDEE] py-3 text-sm font-medium text-[#8C2E3B] transition-colors hover:bg-[#F6DFE1] active:scale-[0.98]"
          >

            {t("Select a topic to begin")}
          </button>

          {/* Start Recording */}
          <button
            type="button"
            onClick={handleStartRecording}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
          >
            <Play className="h-4 w-4 fill-current" strokeWidth={0} />
            {t("Start Recording")}
          </button>

          <p className="mt-3 text-center text-xs text-[#9B8F86]">
            {t("Select a topic to begin")}
          </p>
        </div>

        {/* Bottom nav */}
        <nav className="mt-auto border-t border-[#E7DDD0] px-6 py-4">
          <div className="flex items-center justify-center gap-10">
            <button
              type="button"
              onClick={historyx}
              className="flex items-center gap-2 text-sm text-[#6B5F5C] transition-colors hover:text-[#241416]"
            >
              <History className="h-4 w-4" strokeWidth={1.75} />
              {t("History")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2 text-sm text-[#6B5F5C] transition-colors hover:text-[#241416]"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              {t("Settings")}
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

