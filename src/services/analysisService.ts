import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getTacticalAnalysis(data: any) {
  const prompt = `
    Analyze the following institutional technical performance data with 100% accuracy.
    You are the TRACKORA Intelligence Engine.
    Provide 3-5 concise, high-utility tactical insights based ONLY on the provided data.
    Mood: Aggressive / Professional / Strategic / Mission Control.
    Terminology: Sectors (Branches), Units (Students), Invariants (Metrics), Vectors (Growth).

    Data Context:
    ${JSON.stringify(data, null, 2)}
    
    Constraint: If data is minimal, suggest specific data collection vectors.
    Style: Uppercase headers, rapid-fire directives.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "ANALYSIS INCOMPLETE. UNKNOWN VECTOR DETECTED.";
  } catch (err) {
    console.error("AI Analysis Error:", err);
    return "ANALYSIS ENGINE OFFLINE. CLUSTER STATUS: UNKNOWN.";
  }
}
