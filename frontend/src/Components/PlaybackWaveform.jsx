export function PlaybackWaveform({ className = "" }) {
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