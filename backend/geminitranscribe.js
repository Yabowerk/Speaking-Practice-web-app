const dotenv = require("dotenv");
dotenv.config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function transcribeAmharic(audioPath) {
    try {
        console.log("Uploading audio file...");

        // 1. Upload the file
        const uploadResult = await ai.files.upload({
            file: audioPath,
            mimeType: "audio/wav",
        });

        console.log("Upload complete. Transcribing...");

        const prompt =
            "Transcribe this Amharic audio verbatim in Ge'ez script. Do not translate it to English; return only the exact spoken Amharic text.";

        // 2. Pass fileData explicitly using uploadResult details
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                prompt,
                {
                    fileData: {
                        fileUri: uploadResult.uri,
                        mimeType: uploadResult.mimeType,
                    },
                },
            ],
        });

        // 3. Clean up remote file from Gemini storage
        await ai.files.delete({ name: uploadResult.name });

        return response.text;
    } catch (error) {
        console.error("Transcription Error:", error);
        throw error;
    }
}

async function main() {
    try {
        const transcript = await transcribeAmharic("uploads/tes.wav");
        console.log("Transcript:\n", transcript);
    } catch (err) {
        console.error("Main execution failed:", err.message || err);
    }
}

main();