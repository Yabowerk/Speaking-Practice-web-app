import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { PlaybackWaveform } from "./PlaybackWaveform";
import { FormatDuration } from "./formatDuration";


export function AudioPlayer({ serverdata }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="mt-3 flex items-center gap-3">
            {/* Hidden audio element controlled via ref */}
            <audio
                ref={audioRef}
                src={serverdata?.audio_url}
                onEnded={() => setIsPlaying(false)}
            />

            <button
                type="button"
                onClick={togglePlay}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A2331] text-[#F6F1E7] transition-colors hover:bg-[#6A1E2A]"
                aria-label={isPlaying ? "Pause recording" : "Play recording"}
            >
                {isPlaying ? (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" strokeWidth={0} />
                )}
            </button>

            <PlaybackWaveform className="flex-1 text-[#D9B8BD]" />

            <span className="shrink-0 text-xs tabular-nums text-[#9B8F86]">

                {FormatDuration(serverdata.duration)}
            </span>
        </div>
    );
}