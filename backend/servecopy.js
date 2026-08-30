require('dotenv').config();
//send your API request over IPv6 (a newer internet protocol)
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

//const { supabase } = require('./lib/supabase.js');
const { requireAuth } = require('./middleware/auth.js');
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenAI, Type } = require("@google/genai");
const { AddisAI } = require("addisai");
//const ai = new GoogleGenAI({
// apiKey: process.env.GEMINI_API_KEY,
//});
const addis = new AddisAI({ apiKey: process.env.ADDIS_API_KEY });

app.use(express.json());
app.use(cors());

const uploads = multer({ dest: "uploads/" });

async function main(outputPath) {
    try {
        const transcript = await transcribeAmharic(outputPath);
        console.log("Transcript:\n", transcript);
    } catch (err) {
        console.error("Main execution failed:", err.message || err);
    }
}

async function transcribeAmharic(filePath) {
    try {
        // Read file directly into a base64 string
        const audioBuffer = fs.readFileSync(filePath);
        const base64Audio = audioBuffer.toString('base64');

        // Send inline audio directly to Gemini (No Files API upload needed)
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: "audio/wav",
                        data: base64Audio
                    }
                },
                { text: "Transcribe the audio in Amharic accurately" }
            ]
        });

        return response.text || "";
    } catch (error) {
        console.error("Transcription Error:", error);
        throw error;
    }
}

const router = express.Router();
//const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Multer storage
const upload = multer({ dest: 'uploads/' });

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/session/:lang', upload.single('audio'), async (req, res) => {
    try {
        const { lang } = req.params;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "No authorization header provided" });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        const userId = user.id;

        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        const filePath = req.file.path;
        const originalExtension = path.extname(req.file.originalname) || '.webm';
        const outputPath = `${filePath}${originalExtension}`;

        fs.renameSync(filePath, outputPath);

        // Supabase client authenticated on behalf of the user
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        });

        if (lang === "am") {
            main(outputPath).then(async (transcript) => {
                if (!transcript) {
                    return res.status(500).json({ error: "Failed to generate audio transcript." });
                }
                const durationinsecond = req.body.duration;
                const cleanText = transcript.trim();
                const result = analyzeFillerWordsAm(cleanText, durationinsecond);

                const fileBuffer = fs.readFileSync(outputPath);
                const fileName = `${userId}/${Date.now()}${originalExtension}`;

                const { data: uploadData, error: uploadError } = await userSupabase.storage
                    .from('recordings')
                    .upload(fileName, fileBuffer, {
                        contentType: req.file.mimetype,
                        upsert: false
                    });

                if (uploadError) {
                    console.error("Storage Upload Error:", uploadError);
                    return res.status(500).json({ error: "Failed to upload audio file" });
                }

                const { data: urlData } = userSupabase.storage
                    .from('recordings')
                    .getPublicUrl(fileName);

                const publicAudioUrl = urlData.publicUrl;
                const userMessage = `Topic prompt: "${req.body.topicPrompt}"\n\nTranscript: "${cleanText}"`;

                // ==========================================
                // 1. COMMENTED OUT: AMHARIC LLM CALL
                // ==========================================
                // const response = await amharicllm(userMessage);
                const response = { text: "Mock AI advice for testing (Amharic)" };

                // ==========================================
                // 2. COMMENTED OUT: SUPABASE DB INSERT
                // ==========================================
                /*
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
                            ai_advice: response.text,
                            language: "am"
                        }
                    ])
                    .select();

                if (dbError) {
                    console.error("DB Insert Error Details:", {
                        message: dbError.message,
                        code: dbError.code,
                        details: dbError.details,
                        hint: dbError.hint,
                    });
                    throw new Error(`Database Insert Error: ${dbError.message}`);
                }
                */

                // Clean up local temp file
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }

                return res.json({
                    message: "Session processed successfully (Testing Mode)",
                    data: {
                        user_id: userId,
                        topic_prompt: req.body.topicPrompt,
                        audio_url: publicAudioUrl,
                        transcript: cleanText,
                        duration_seconds: durationinsecond,
                        filler_count: result.totalFillers,
                        avg_wpm: result.wpm,
                        filler_breakdown: result.fillerBreakdown,
                        ai_advice: response.text,
                        language: "am"
                    }
                });
            }).catch((err) => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
                console.error("Transcription Error (AM):", err);
                return res.status(500).json({ error: "Transcription failed" });
            });
        } else {
            const transcript = await main(outputPath);
            const durationinsecond = req.body.duration;
            const cleanText = transcript.trim();
            const result = analyzeFillerWords(cleanText, durationinsecond);

            const fileBuffer = fs.readFileSync(outputPath);
            const fileName = `${userId}/${Date.now()}${originalExtension}`;

            const { data: uploadData, error: uploadError } = await userSupabase.storage
                .from('recordings')
                .upload(fileName, fileBuffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error("Storage Upload Error:", uploadError);
                return res.status(500).json({ error: "Failed to upload audio file" });
            }

            const { data: urlData } = userSupabase.storage
                .from('recordings')
                .getPublicUrl(fileName);

            const publicAudioUrl = urlData.publicUrl;
            const userMessage = `Topic prompt: "${req.body.topicPrompt}"\n\nTranscript: "${cleanText}"`;

            // ==========================================
            // 1. COMMENTED OUT: GEMINI LLM CALL
            // ==========================================
            /*
            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: userMessage,
                config: {
                    systemInstruction: `You are a supportive speaking coach...`,
                },
            });
            */
            const response = { text: "Mock AI advice for testing (English)" };

            // ==========================================
            // 2. COMMENTED OUT: SUPABASE DB INSERT
            // ==========================================
            /*
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
                        ai_advice: response.text
                    }
                ])
                .select();

            if (dbError) {
                console.error("DB Insert Error Details:", {
                    message: dbError.message,
                    code: dbError.code,
                    details: dbError.details,
                    hint: dbError.hint,
                });
                throw new Error(`Database Insert Error: ${dbError.message}`);
            }
            */

            // Clean up local temp file
            if (fs.existsSync(outputPath)) {
                //fs.unlinkSync(outputPath);
            }

            return res.json({
                message: "Session processed successfully (Testing Mode)",
                data: {
                    user_id: userId,
                    topic_prompt: req.body.topicPrompt,
                    audio_url: publicAudioUrl,
                    transcript: cleanText,
                    duration_seconds: durationinsecond,
                    filler_count: result.totalFillers,
                    avg_wpm: result.wpm,
                    filler_breakdown: result.fillerBreakdown,
                    ai_advice: response.text,
                    language: lang
                }
            });
        }
    } catch (error) {
        console.error("Route Handler Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
});

// Mount the router on the express app
app.use('/', router);

// Start server listening
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});

module.exports = router;