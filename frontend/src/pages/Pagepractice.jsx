import React, { useState } from "react";
import SpeakingPracticeRecording from "./Recording";
import supabase from "../lib/supabase";

export default function PracticePage() {
  const [recordingData, setRecordingData] = useState(null);
  const [message, setMessage] = useState('');

  // 1. RECEIVE THE FILE HERE
  const handleStopRecording = async (duration, blob, url) => {
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
    formData.append("topicPrompt", "How has technology changed the way we learn and grow?");
    //fetch supabase safely
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const response = await fetch("http://localhost:3000/session", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData,
    });

    const result = await response.json();
    setMessage(result.message);
    console.log(result);
  };

  return (
    <div>
      {!recordingData ? (
        // Pass handleStopRecording to onStop
        <SpeakingPracticeRecording
          topic="How has technology changed the way we learn and grow?"
          onStop={handleStopRecording}
          onDiscard={() => console.log("Discarded")}
        />
      ) : (
        // 2. PLAY OR DOWNLOAD THE FILE HERE
        <div className="p-8 text-center flex flex-col items-center gap-4">
          <h2 className="text-xl font-bold">Recording Finished!</h2>
          <p>Duration: {recordingData.duration} seconds</p>

          {/* Instant audio playback */}
          <audio src={recordingData.url} controls className="mt-2" />

          {/* Download button using the playable URL */}
          <a
            href={recordingData.url}
            download="speaking-practice.webm"
            className="px-4 py-2 bg-[#7A2331] text-white rounded-full font-medium text-sm"
          >
            Download Audio File{message}
          </a>
        </div>
      )}
    </div>
  );
}