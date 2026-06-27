require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeAds(adsData, companyDescription = "", platform = "Meta") {
  const context = companyDescription
    ? `This company's business: "${companyDescription}". Use this context to provide relevant, tailored insights.`
    : "Provide general advertising insights.";

  const prompt = `
You are an expert ${platform} Ads analyst and marketing strategist.

${context}

Analyze the following ${platform} campaign data and provide actionable insights.

Return ONLY valid JSON (no markdown, no explanation):
{
  "winners": [{ "campaign": "Campaign Name", "reason": "Why it performed well" }],
  "losers":  [{ "campaign": "Campaign Name", "reason": "Why it underperformed" }],
  "recommendations": ["Specific actionable recommendation 1", "..."],
  "scaling_opportunities": ["Campaign X is ready to scale because...", "..."]
}

Campaign Data:
${JSON.stringify(adsData, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const cleaned = response.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}

module.exports = analyzeAds;
