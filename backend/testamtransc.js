const dotenv = require("dotenv");
dotenv.config();
const { AddisAI, fileFromPath } = require("addisai");

const addis = new AddisAI({ apiKey: process.env.ADDIS_API_KEY });

// 1. Wrap in an async function
async function run() {
    try {
        const voiceCmd = await addis.chat.completions.create({
            language: "am",
            messages: [{ role: "user", content: "" }],
            audio: await fileFromPath("uploads/tes.wav"),
        });

        console.log(voiceCmd.transcription?.clean);
    } catch (error) {
        console.error("Error:", error);
    }
}

// 2. Call the function
run();