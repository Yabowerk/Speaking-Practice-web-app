const { nodewhisper } = require("nodejs-whisper");

async function testAmharicTranscription() {
    console.log("Starting Amharic transcription test...");

    try {
        const transcript = await nodewhisper("uploads/amharic-test.wav", {
            modelName: "small",
            autoDownloadModelName: "small",
            language: "am",
            task: "transcribe",
        });

        console.log("Transcript:");
        console.log(transcript);
    } catch (err) {
        console.error("Transcription failed:", err);
    }
}

testAmharicTranscription();