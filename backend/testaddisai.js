const dotenv = require("dotenv");
dotenv.config();
const { AddisAI } = require("addisai");

const addis = new AddisAI({ apiKey: process.env.ADDIS_API_KEY });

async function main() {
    try {
        const res = await addis.chat.completions.create({

            language: "am",
            messages: [{ role: "user", content: "Generate 20 creative, open-ended speaking practice prompts." }
                ,
            {
                role: "system",
                content: "You are a prompt generator for spontaneous speaking practice. Return only open-ended questions or direct prompts suitable for a 5-minute response. No numbering, no quotation marks."
            }
            ],
        });

        // Safely log content
        console.log(res?.choices?.[0]?.message?.content);
    } catch (error) {
        console.error("Error from AddisAI:", error);
    }
}

main();