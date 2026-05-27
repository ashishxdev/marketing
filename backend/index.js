require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const adsData = require("./adsData");

// Gemini Setup
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Telegram Sender Function
async function sendTelegramMessage(message) {

    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {

        await axios.post(url, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
        });

        console.log("✅ Telegram message sent!");

    } catch (error) {

        console.error("❌ Telegram Error:");
        console.error(error.response?.data || error.message);

    }
}

async function main() {

    try {

        // AI Prompt
        const prompt = `
You are an expert Meta and Google Ads analyst.

Analyze the following ad campaign data.

Find:
1. Best performing campaigns
2. Worst performing campaigns
3. High CPC issues
4. Low CTR issues
5. Ad fatigue
6. Budget optimization opportunities
7. Scaling opportunities
8. Actionable recommendations

Return response ONLY in valid JSON format.

Format:
{
  "winners": [
  {
    "campaign": "Campaign Name",
    "reason": "Why it performed well"
  }
],
"losers": [
  {
    "campaign": "Campaign Name",
    "reason": "Why it performed poorly"
  }
]
  "recommendations": ["string"],
"scaling_opportunities": ["string"]
}

Ads Data:
${JSON.stringify(adsData, null, 2)}
`;

        // Gemini Analysis
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        // Raw AI response
        const rawText = response.text;

        // Clean markdown if Gemini adds it
        const cleanedText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Convert AI response to JSON
        const parsedData = JSON.parse(cleanedText);

        console.log("\n========= AI REPORT =========\n");
        console.log(parsedData);

        // Create Telegram Report
        const winners = parsedData.winners
            .map((w) => `• ${w.campaign} → ${w.reason}`)
            .join("\n");

        const losers = parsedData.losers
            .map((l) => `• ${l.campaign} → ${l.reason}`)
            .join("\n");

        const recommendations = parsedData.recommendations
            .map((r) => `• ${r}`)
            .join("\n");

        const scaling = parsedData.scaling_opportunities
            .map((s) => `• ${s}`)
            .join("\n");

        const report = `
🔥 AI MARKETING REPORT

🏆 Winners:
${winners}

❌ Losers:
${losers}

📈 Recommendations:
${recommendations}

🚀 Scaling Opportunities:
${scaling}
`;
        console.log("\nSending Telegram Report...\n");

        // Send Telegram Message
        await sendTelegramMessage(report);

    } catch (error) {

        console.error("\n❌ ERROR:\n");
        console.error(error.message);

    }
}

main();