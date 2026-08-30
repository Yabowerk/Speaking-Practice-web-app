import React, { useEffect, useRef, useState, useContext } from "react";
import { Pin, Play, Pause, Check, AlertCircle, RefreshCw } from "lucide-react";
import supabase from "../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useTranslation } from "react-i18next";

export default function Recording({
  topic = "How has technology changed the way we learn and grow?",
  autoStart = true,
  onStop = (seconds, blob, url) => { },
  onDiscard = () => { },
}) {
  const url = import.meta.env.VITE_API_URL;
  const { LoadingState, setServerdata } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTopic = location.state?.topic || topic;
  const [seconds, setSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);

  const intervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const [recordingData, setRecordingData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation();

  // RECEIVE THE FILE HERE
  const handleStopRecording = async (duration, blob, url) => {
    setLoading(true);
    console.log("Recorded duration in seconds:", duration);
    console.log("Raw audio blob object:", blob);
    console.log("Playable URL:", url);

    setRecordingData({
      duration,
      blob,
      url,
    });

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("durationSeconds", duration);
    formData.append("topicPrompt", activeTopic);

    // Fetch supabase safely
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    // Fixed: Backticks used for dynamic URL string template
    const response = await fetch(`${url}/session/${i18n.language}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log(result);
      setServerdata(result);
      setLoading(false);
      navigate("/results");
    }
  };

  // Initialize microphone & MediaRecorder
  const startRecordingStream = async () => {
    try {
      setError(null);

      // Fixed: Properly enclosed constraints in object wrapper { audio: { ... } }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,   // Eliminates speaker loop feedback/echo
          noiseSuppression: true,   // Removes ambient background noise
          autoGainControl: true,    // Prevents clipping distortion
          channelCount: 1,          // Enforces single-channel mono capture
          sampleRate: 48000,        // Sets standard browser input sample rate
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Microphone permission/access error:", err);
      setError("Microphone access denied or unavailable. Please check permissions.");
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (autoStart) {
      startRecordingStream();
    }
    return () => cleanupHardwareStream();
  }, []);

  // Timer interval tied directly to recording & pause states
  useEffect(() => {
    if (isRecording && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRecording, isPaused]);

  // Release microphone tracks safely
  const cleanupHardwareStream = () => {
    clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const togglePauseResume = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleFinish = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      cleanupHardwareStream();
      setIsRecording(false);
      setIsPaused(false);

      handleStopRecording(seconds, audioBlob, audioUrl);
    };

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDiscard = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    cleanupHardwareStream();
    setIsRecording(false);
    setIsPaused(false);
    onDiscard();
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return loading ? (
    <LoadingState />
  ) : (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden">
        <div className="flex-1 px-6 pt-8 sm:pt-10 pb-6 flex flex-col">
          {/* Topic pin card */}
          <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
              <Pin className="h-3 w-3" strokeWidth={2} />
              {t("Topic")}
            </div>
            <p className="mt-2 font-serif text-base sm:text-lg leading-snug text-[#241416]">
              {activeTopic}
            </p>
          </div>

          {/* Permission error state */}
          {error ? (
            <div className="mt-8 flex flex-col items-center text-center p-4 rounded-xl bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-sm font-medium">{error}</p>
              <button
                type="button"
                onClick={startRecordingStream}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("Retry Permission")}
              </button>
            </div>
          ) : (
            <>
              {/* Status + timer */}
              <div className="mt-10 flex flex-col items-center">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase transition-colors">
                  {isRecording && !isPaused ? "Recording..." : isPaused ? "Paused" : "Initializing..."}
                </span>
                <span className="mt-2 font-serif text-5xl sm:text-6xl tabular-nums text-[#241416]">
                  {mm}:{ss}
                </span>
                <LiveWaveform active={isRecording && !isPaused} className="mt-4 text-[#D9B8BD]" />
              </div>

              {/* Pulsing mic button */}
              <div className="mt-8 flex items-center justify-center">
                <button
                  type="button"
                  onClick={togglePauseResume}
                  disabled={!isRecording && !isPaused}
                  aria-label={isPaused ? "Continue recording" : "Pause recording"}
                  className="relative flex items-center justify-center h-52 w-52 focus:outline-none group rounded-full disabled:opacity-50"
                >
                  {isRecording && !isPaused && (
                    <>
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#E9B3BB] opacity-30 animate-ping-slow pointer-events-none" />
                      <span className="absolute inline-flex h-[78%] w-[78%] rounded-full bg-[#E9A3AC] opacity-40 animate-ping-slower pointer-events-none" />
                    </>
                  )}
                  <span className="absolute inline-flex h-[78%] w-[78%] rounded-full bg-[#F0C7CC] transition-transform group-hover:scale-105" />
                  <span className="absolute inline-flex h-[54%] w-[54%] rounded-full bg-[#7A2331] shadow-lg items-center justify-center transition-transform group-active:scale-95">
                    <MicIcon className="h-9 w-9 text-[#F6F1E7]" />
                  </span>
                </button>
              </div>

              {/* Control Buttons */}
              <div className="mt-8 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={togglePauseResume}
                    disabled={!isRecording && !isPaused}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#7A2331] py-3.5 text-sm font-semibold text-[#7A2331] transition-all hover:bg-[#7A2331]/10 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        {t("Continue")}
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 fill-current" />
                        {t("Pause")}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={!isRecording && !isPaused && seconds === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-all hover:bg-[#6A1E2A] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    {t("Finish")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDiscard}
                  className="mt-2 text-center text-sm text-[#9B8F86] underline underline-offset-2 transition-colors hover:text-[#6B5F5C]"
                >
                  {t("Discard and cancel")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

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

function MicIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 1 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z" fill="currentColor" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 18.5V21" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

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