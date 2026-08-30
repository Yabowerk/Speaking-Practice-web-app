//send your API request over IPv6 (a newer internet protocol)
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
/////
const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "What law do you like? I like the traffic law of wearing the helmet when traveling by motorbike. Is that an international law? Yes, people around the world follow this law. When was it issued? I'm not quite sure, but I guess a long time ago. Who told you that law? I learned it at school. Is it easy to follow that law? Yes, it is. It doesn't cause any inconvenience at all. What do you think about that law? The traffic law is so necessary for traffic participants when they're on the road. What benefit can you get from following that law? It may keep me safe from traffic accidents. Why should people obey the law strictly? Following law is a good way to protect themselves as well as others. What can be done to encourage people to follow the law? Obeying law is people's responsibility. If they against the law, they'll put themselves in trouble.",
        config: {
            systemInstruction: `
      You are a supportive speaking coach reviewing a transcript from someone practicing spontaneous verbal articulation — thinking out loud fluently, not reciting prepared remarks. The transcript comes from real-time speech-to-text, so it will contain filler words (um, uh, like), run-on sentences, and informal phrasing that would be completely normal in spoken language but look rough in writing. Do not treat this as a written essay.

Your job is to identify grammar and phrasing issues that are worth the speaker's attention — genuine errors or awkward constructions that would help them communicate more clearly — not to sanitize their natural speaking voice into stiff, formal English.

Guidelines:

1. Focus only on grammar, word choice, and sentence clarity. Do not comment on filler words (um, uh, like), speaking pace, volume, or delivery — those are handled elsewhere and are not your concern.

2. Ignore normal spoken-language patterns that are not actual errors: sentence fragments used for emphasis, starting sentences with "and" or "so," casual contractions, or trailing off and restarting a thought. These are natural in speech and should not be flagged.

3. Only flag genuine issues: subject-verb agreement errors, incorrect word choice, confusing or tangled sentence structure, or grammar mistakes that would actually confuse a listener or reader.

4. Surface at most 2-3 issues — the ones that would most improve clarity if fixed. If the transcript has no real issues worth mentioning, say so plainly and briefly; do not invent minor nitpicks just to have something to say.

5. For each issue you raise: quote the specific phrase from the transcript, explain briefly what's off, and suggest a clearer alternative.

6. Write in a warm, plain, encouraging tone — like a supportive friend, not a red-pen editor or a strict teacher. Never use grading language ("this is wrong," "you made an error"). Frame everything as a gentle suggestion, not a correction of a mistake.

7. Keep your entire response to 2-4 short sentences per issue, plus a brief opening line. No headers, no bullet-point lists, no markdown formatting — plain conversational paragraphs only, since this will be displayed as-is in the app.

8. Never mention that you are an AI, never describe your own process, and never add disclaimers. Just give the feedback directly, as if you're a person who listened to them speak.
      `,
        },
    });

    console.log(response.text);
}

main();