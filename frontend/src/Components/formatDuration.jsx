export function FormatDuration(secondsstr) {
    const totalSeconds = Math.round(parseFloat(secondsstr) || 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Pad with leading zeros (e.g., "01:09")
    const formattedMins = String(minutes).padStart(2, "0");
    const formattedSecs = String(seconds).padStart(2, "0");

    return `${formattedMins}:${formattedSecs}`;
    //return `${secondsstr}`
}