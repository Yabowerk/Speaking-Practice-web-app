const { nodewhisper } = require("nodejs-whisper");
const path = require('path');
const absoluteAudioPath = path.resolve("uploads/test.wav");
//cleans the text
function getCleanText(transcript) {
    if (!transcript) return "";

    return transcript
        // 1. Remove timestamp patterns like [00:00:26.280 --> 00:00:30.720]
        .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, "")
        // 2. Normalize multiple spaces, tabs, and line breaks into a single space
        .replace(/\s+/g, " ")
        // 3. Trim outer spacing
        .trim();
}
//speech analyzer
function analyzeSpeech(cleanText, durationInSeconds) {
    if (!cleanText || durationInSeconds <= 0) {
        return { wpm: 0, totalFillers: 0, fillerBreakdown: {} };
    }


    const wordsArray = cleanText.split(/\s+/).filter(word => word.length > 0);
    const totalWords = wordsArray.length;

    const minutes = durationInSeconds / 60;
    const wpm = Math.round(totalWords / minutes);//calculates word per minute


    const fillerList = ["um", "uh", "like", "you know", "so", "actually"];

    let totalFillers = 0;
    const fillerBreakdown = {};

    fillerList.forEach((filler) => {

        const regex = new RegExp(`\\b${filler}\\b`, "gi");
        const matches = cleanText.match(regex);

        if (matches) {
            const count = matches.length;
            fillerBreakdown[filler] = count;
            totalFillers += count;
        }
    });

    return {
        totalWords,
        wpm,
        totalFillers,
        fillerBreakdown
    };
}
//calculates the duration of the transcript(return in seconds)
function getDurationFromTranscript(transcript) {
    if (!transcript) return 0;
    const timestampMatches = transcript.match(/-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})/g);

    if (!timestampMatches) return 0;
    const lastTimestamp = timestampMatches[timestampMatches.length - 1];

    //extract HH, MM, SS using Regex capture groups
    const timeParts = lastTimestamp.match(/-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})/);

    const hours = parseFloat(timeParts[1]);
    const minutes = parseFloat(timeParts[2]);
    const seconds = parseFloat(timeParts[3]);


    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    return Math.round(totalSeconds * 100) / 100;
}
//transcriber
nodewhisper(absoluteAudioPath, {
    modelName: "base.en",
    autoDownloadModelName: "base.en",

})
    .then((transcript) => {
        // console.log("Transcript:", transcript);
        const cleanText = getCleanText(transcript);
        const durationinsecond = getDurationFromTranscript(transcript);
        const result = analyzeSpeech(cleanText, durationinsecond)
        console.log(result);

    })
    .catch((err) => {
        console.error("Whisper failed:", err);
    });