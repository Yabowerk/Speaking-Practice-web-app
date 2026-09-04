require('dotenv').config();
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
const express = require('express');
const app = express();
const multer = require("multer");
const PORT = 3000;
const cors = require("cors");
const { convertToWav, getAudioDuration } = require("./convert");
const fs = require("fs");
const { nodewhisper } = require("nodejs-whisper");
const path = require('path');

const { supabase } = require('./lib/supabase.js');
const { requireAuth } = require('./middleware/auth.js');
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenAI, Type } = require("@google/genai");
const { AddisAI } = require("addisai");
const WebSocket = require('ws');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
const addis = new AddisAI({ apiKey: process.env.ADDIS_API_KEY });

app.use(express.json());
app.use(cors());

const uploads = multer({ dest: "uploads/" });

//ai reponse cleaner
function stripMarkdown(text) {
    if (!text) return "";

    return text
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/^[-*]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, "")
        .replace(/^-{3,}$/gm, "")
        .replace(/`{1,3}[^`]*`{1,3}/g, "")
        .replace(/[—–]/g, ", ")
        .replace(/>\s?/gm, "")
        .replace(/\n{2,}/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// Amharic LLM Response
async function amharicllm(userMessage) {
    try {
        const res = await addis.chat.completions.create({
            model: "addisai",
            messages: [
                {
                    role: "system",
                    content: `You are a supportive speaking coach reviewing a transcript from someone practicing spontaneous verbal articulation — thinking out loud fluently, not reciting prepared remarks. The transcript comes from real-time speech-to-text, so it will contain filler words (um, uh, like), run-on sentences, and informal phrasing that would be completely normal in spoken language but look rough in writing. Do not treat this as a written essay.

Your job is to identify grammar and phrasing issues that are worth the speaker's attention — genuine errors or awkward constructions that would help them communicate more clearly — not to sanitize their natural speaking voice into stiff, formal English.

Guidelines:

1. Focus only on grammar, word choice, and sentence clarity. Do not comment on filler words (um, uh, like), speaking pace, volume, or delivery — those are handled elsewhere and are not your concern.
2. Ignore normal spoken-language patterns that are not actual errors: sentence fragments used for emphasis, starting sentences with "and" or "so," casual contractions, or trailing off and restarting a thought. These are natural in speech and should not be flagged.
3. You will be given the topic prompt the speaker was responding to, along with their transcript. Use the topic only as context to understand what they were trying to say — do not comment on whether they stayed on topic, and do not mention the topic explicitly in your feedback.
4. Only flag genuine issues: subject-verb agreement errors, incorrect word choice, confusing or tangled sentence structure, or grammar mistakes that would actually confuse a listener or reader.
5. Surface at most 2-3 issues — the ones that would most improve clarity if fixed. If the transcript has no real issues worth mentioning, say so plainly and briefly; do not invent minor nitpicks just to have something to say.
6. For each issue you raise: quote the specific phrase from the transcript, explain briefly what's off, and suggest a clearer alternative.
7. Write in a warm, plain, encouraging tone — like a supportive friend, not a red-pen editor or a strict teacher. Never use grading language ("this is wrong," "you made an error"). Frame everything as a gentle suggestion, not a correction of a mistake.
8. Keep your entire response to 2-4 short sentences per issue, plus a brief opening line. No headers, no bullet-point lists, no markdown formatting — plain conversational paragraphs only, since this will be displayed as-is in the app.
9. Never mention that you are an AI, never describe your own process, and never add disclaimers. Just give the feedback directly, as if you're a person who listened to them speak.`
                },
                {
                    role: "user",
                    content: userMessage
                }
            ]
        });

        return res?.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("Error from AddisAI:", error);
        throw error;
    }
}

//fast english transcriber
async function transcribeEnglishViaAPI(filePath) {
    try {
        console.log("transcription started used api");
        const audioBuffer = fs.readFileSync(filePath);
        const base64Audio = audioBuffer.toString('base64');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: "audio/wav",
                        data: base64Audio
                    }
                },
                { text: "Transcribe this English audio verbatim. Return only the exact spoken text, no commentary." }
            ]
        });

        return response.text || "";
    } catch (error) {
        console.error("English API Transcription Error:", error);
        throw error;
    }
}

// Amharic Transcriber
async function transcribeAmharic(audioPath) {
    try {
        console.log("Uploading audio file...");
        const uploadResult = await ai.files.upload({
            file: audioPath,
            mimeType: "audio/wav",
        });

        console.log("Upload complete. Transcribing...");
        const prompt = "Transcribe this Amharic audio verbatim in Ge'ez script. Do not translate it to English; return only the exact spoken Amharic text.";

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
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

        await ai.files.delete({ name: uploadResult.name });
        return response.text;
    } catch (error) {
        console.error("Transcription Error:", error);
        throw error;
    }
}

function getCleanText(transcript) {
    if (!transcript) return "";
    return transcript
        .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function analyzeSpeech(cleanText, durationInSeconds, fillerList) {
    if (!cleanText || durationInSeconds <= 0) {
        return { totalWords: 0, wpm: 0, totalFillers: 0, fillerBreakdown: {} };
    }

    const wordsArray = cleanText.split(/\s+/).filter(word => word.length > 0);
    const totalWords = wordsArray.length;
    const minutes = durationInSeconds / 60;
    const wpm = Math.round(totalWords / minutes);

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

    return { totalWords, wpm, totalFillers, fillerBreakdown };
}

function getDurationFromTranscript(transcript) {
    if (!transcript) return 0;
    const timestampMatches = transcript.match(/-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})/g);
    if (!timestampMatches) return 0;

    const lastTimestamp = timestampMatches[timestampMatches.length - 1];
    const timeParts = lastTimestamp.match(/-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})/);

    const hours = parseFloat(timeParts[1]);
    const minutes = parseFloat(timeParts[2]);
    const seconds = parseFloat(timeParts[3]);

    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    return Math.round(totalSeconds * 100) / 100;
}

app.get('/', (req, res) => {
    res.json({ message: "Backend server is running successfully!" });
});

app.get("/sessions/:lang", requireAuth, async (req, res) => {
    const authHeader = req.headers.authorization;
    const { lang } = req.params;

    const userSupabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: { headers: { Authorization: authHeader } },
            realtime: { transport: WebSocket },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    );

    try {
        const { data, error } = await userSupabase
            .from('sessions')
            .select('*')
            .eq('language', lang)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return res.json(data);
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        return res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

app.post("/api/:lang/topics", requireAuth, async (req, res) => {
    const { lang } = req.params;

    if (lang === "am") {
        try {
            const { exclude } = req.body;
            let contents = "Generate 20 creative, open-ended speaking practice prompts in Amharic script.";

            if (exclude && Array.isArray(exclude) && exclude.length > 0) {
                contents += ` Avoid generating any topics that are identical or very similar to the following: \n${exclude.slice(-30).join("\n")}`;
            }

            const response = await addis.chat.completions.create({
                model: "addisai",
                messages: [
                    {
                        role: "system",
                        content: "You are a prompt generator for spontaneous speaking practice in Amharic. Return ONLY a valid JSON array of strings containing open-ended questions or direct prompts in Amharic suitable for a 5-minute response. No markdown formatting, no code blocks, no extra text, no numbering, no quotation marks outside the JSON structure.",
                    },
                    {
                        role: "user",
                        content: contents,
                    },
                ],
            });

            const rawText = response.choices[0].message.content.trim();
            const topics = JSON.parse(rawText);
            return res.json({ topics });
        } catch (error) {
            console.error("Failed to generate Amharic topic batch:", error);
            return res.status(500).json({ error: "Failed to generate topics am" });
        }
    } else {
        try {
            const { exclude } = req.body;
            let contents = "Generate 20 creative, open-ended speaking practice prompts.";

            if (exclude && Array.isArray(exclude) && exclude.length > 0) {
                contents += ` Avoid generating any topics that are identical or very similar to the following: \n${exclude.slice(-30).join("\n")}`;
            }

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: contents,
                config: {
                    systemInstruction: "You are a prompt generator for spontaneous speaking practice. Return only open-ended questions or direct prompts suitable for a 5-minute response. No numbering, no quotation marks.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
            });

            const topics = JSON.parse(response.text);
            return res.json({ topics });
        } catch (error) {
            console.error("Failed to generate topic batch:", error);
            return res.status(500).json({ error: "Failed to generate topics" });
        }
    }
});

app.post("/session/:lang", requireAuth, uploads.single("audio"), async (req, res) => {
    const { lang } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const accessToken = req.accessToken;
    const userId = req.user.id;
    const inputPath = req.file.path;
    const outputPath = `${req.file.path}.wav`;

    if (lang === "am") {
        try {
            const wavPath = await convertToWav(inputPath, outputPath);
            const rawTranscript = await transcribeAmharic(outputPath);

            const userSupabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY,
                {
                    global: { headers: { Authorization: `Bearer ${accessToken}` } },
                    realtime: { transport: WebSocket },
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                    },
                }
            );

            const cleanText = getCleanText(rawTranscript);
            const durationinsecond = await getAudioDuration(outputPath);
            const fillerList = ["እሽ", "ኧኧ...", "ማለት", "እ"];
            const result = analyzeSpeech(cleanText, durationinsecond, fillerList);

            const fileBuffer = fs.readFileSync(outputPath);
            const storageFilePath = `${userId}/${Date.now()}_${req.file.originalname}`;

            const { error: uploadError } = await userSupabase
                .storage
                .from('recordings')
                .upload(storageFilePath, fileBuffer, {
                    contentType: req.file.mimetype || 'audio/webm',
                    upsert: false
                });

            if (uploadError) throw new Error(`Supabase Storage Upload Error: ${uploadError.message}`);

            const { data: urlData } = userSupabase
                .storage
                .from('recordings')
                .getPublicUrl(storageFilePath);

            const publicAudioUrl = urlData.publicUrl;
            const userMessage = `Topic prompt: "${req.body.topicPrompt}"\n\nTranscript: "${cleanText}"`;

            // Fix: amharicllm returns a string
            const aiAdvice = await amharicllm(userMessage);

            const { data: dbData, error: dbError } = await userSupabase
                .from('sessions')
                .insert([
                    {
                        user_id: userId,
                        topic_prompt: req.body.topicPrompt,
                        audio_url: publicAudioUrl,
                        transcript: cleanText,
                        duration_seconds: durationinsecond,
                        filler_count: result.totalFillers,
                        avg_wpm: result.wpm,
                        filler_breakdown: result.fillerBreakdown,
                        ai_advice: aiAdvice,
                        language: "am"
                    }
                ])
                .select();

            if (dbError) throw new Error(`Database Insert Error: ${dbError.message}`);

            return res.json({
                date: `${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[A-Za-z]+$/, ''),
                duration: `${durationinsecond}`,
                fillerWords: result.totalFillers,
                avgWpm: result.wpm,
                transcript: cleanText,
                topic: req.body.topicPrompt,
                message: "File uploaded and converted successfully!",
                originalFile: inputPath,
                convertedFile: wavPath,
                audio_url: publicAudioUrl,
                ai: aiAdvice
            });

        } catch (error) {
            console.error("Amharic session processing failed:", error);
            return res.status(500).json({ error: "Failed to process Amharic recording" });
        } finally {
            fs.unlink(inputPath, () => { });
            fs.unlink(outputPath, () => { });
        }
    } else {
        try {
            const wavPath = await convertToWav(inputPath, outputPath);
            const absoluteWavPath = path.resolve(wavPath);
            const TRANSCRIPTION_MODE = process.env.TRANSCRIPTION_MODE || "local";

            const transcript = TRANSCRIPTION_MODE === "api"
                ? await transcribeEnglishViaAPI(wavPath)
                : await nodewhisper(absoluteWavPath, {
                    modelName: "base.en",
                    autoDownloadModelName: "base.en",
                });

            const userSupabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY,
                {
                    global: { headers: { Authorization: `Bearer ${accessToken}` } },
                    realtime: { transport: WebSocket },
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                    },
                }
            );

            const cleanText = getCleanText(transcript);
            const durationinsecond = await getAudioDuration(outputPath);
            const fillerList = ["um", "uh", "like", "you know", "so", "actually"];
            const result = analyzeSpeech(cleanText, durationinsecond, fillerList);

            const fileBuffer = fs.readFileSync(wavPath);
            const storageFilePath = `${userId}/${Date.now()}_${req.file.originalname}`;

            const { error: uploadError } = await userSupabase
                .storage
                .from('recordings')
                .upload(storageFilePath, fileBuffer, {
                    contentType: req.file.mimetype || 'audio/webm',
                    upsert: false
                });

            if (uploadError) throw new Error(`Supabase Storage Upload Error: ${uploadError.message}`);

            const { data: urlData } = userSupabase
                .storage
                .from('recordings')
                .getPublicUrl(storageFilePath);

            const publicAudioUrl = urlData.publicUrl;
            const userMessage = `Topic prompt: "${req.body.topicPrompt}"\n\nTranscript: "${cleanText}"`;

            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: userMessage,
                config: {
                    systemInstruction: `You are a supportive speaking coach reviewing a transcript from someone practicing spontaneous verbal articulation — thinking out loud fluently, not reciting prepared remarks. The transcript comes from real-time speech-to-text, so it will contain filler words (um, uh, like), run-on sentences, and informal phrasing that would be completely normal in spoken language but look rough in writing. Do not treat this as a written essay.

Your job is to identify grammar and phrasing issues that are worth the speaker's attention — genuine errors or awkward constructions that would help them communicate more clearly — not to sanitize their natural speaking voice into stiff, formal English.

Guidelines:

1. Focus only on grammar, word choice, and sentence clarity. Do not comment on filler words (um, uh, like), speaking pace, volume, or delivery — those are handled elsewhere and are not your concern.

2. Ignore normal spoken-language patterns that are not actual errors: sentence fragments used for emphasis, starting sentences with "and" or "so," casual contractions, or trailing off and restarting a thought. These are natural in speech and should not be flagged.

3. Only flag genuine issues: subject-verb agreement errors, incorrect word choice, confusing or tangled sentence structure, or grammar mistakes that would actually confuse a listener or reader.

4. Surface at most 2-3 issues — the ones that would most improve clarity if fixed. If the transcript has no real issues worth mentioning, say so plainly and briefly; do not invent minor nitpicks just to have something to say.

5. For each issue you raise: quote the specific phrase from the transcript, explain briefly what's off, and suggest a clearer alternative.

6. Write in a warm, plain, encouraging tone — like a supportive friend, not a red-pen editor or a strict teacher. Never use grading language ("this is wrong," "you made an error"). Frame everything as a gentle suggestion, not a correction of a mistake.

7. Keep your entire response to 2-4 short sentences per issue, plus a brief opening line. No headers, no bullet-point lists, no markdown formatting — plain conversational paragraphs only, since this will be displayed as-is in the app.

8. Never mention that you are an AI, never describe your own process, and never add disclaimers. Just give the feedback directly, as if you're a person who listened to them speak.`,
                },
            });
            const cleanAdvice = stripMarkdown(response.text);

            const { data: dbData, error: dbError } = await userSupabase
                .from('sessions')
                .insert([
                    {
                        user_id: userId,
                        topic_prompt: req.body.topicPrompt,
                        audio_url: publicAudioUrl,
                        transcript: cleanText,
                        duration_seconds: durationinsecond,
                        filler_count: result.totalFillers,
                        avg_wpm: result.wpm,
                        filler_breakdown: result.fillerBreakdown,
                        ai_advice: cleanAdvice
                    }
                ])
                .select();

            if (dbError) throw new Error(`Database Insert Error: ${dbError.message}`);

            return res.json({
                date: `${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?[A-Za-z]+$/, ''),
                duration: `${durationinsecond}`,
                fillerWords: result.totalFillers,
                avgWpm: result.wpm,
                transcript: cleanText,
                topic: req.body.topicPrompt,
                message: "File uploaded and converted successfully!",
                originalFile: inputPath,
                convertedFile: wavPath,
                audio_url: publicAudioUrl,
                ai: cleanAdvice
            });

        } catch (error) {
            console.error("Session processing failed:", error);
            return res.status(500).json({ error: "Failed to process recording" });
        } finally {
            fs.unlink(inputPath, () => { });
            fs.unlink(outputPath, () => { });
        }
    }
});

app.listen(PORT, (err) => {
    if (err) {
        console.error(`❌ Failed to start server on port ${PORT}:`, err.message);
        process.exit(1);
    }
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});