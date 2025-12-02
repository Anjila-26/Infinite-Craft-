import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface CraftResult {
  name: string;
  emoji: string;
}

export async function generateCraftResult(
  element1: string,
  element2: string
): Promise<CraftResult | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are playing Infinite Craft, a game where you combine two elements to create something new.

Combine "${element1}" and "${element2}" to create a single new element.

Rules:
- Return ONLY a valid JSON object with this exact format: {"name": "ElementName", "emoji": "🎯"}
- The name should be a single word or short phrase (2-3 words max, capitalize properly)
- Choose an appropriate emoji that represents the result
- Be creative but logical - think about what would actually result from combining these elements
- If the combination truly doesn't make sense, return: {"name": "Nothing", "emoji": "❌"}
- Do not include any explanation, markdown formatting, code blocks, or additional text - ONLY the raw JSON object
- The response must be valid JSON that can be parsed directly

Examples:
- "Water" + "Fire" = {"name": "Steam", "emoji": "💨"}
- "Earth" + "Fire" = {"name": "Lava", "emoji": "🌋"}
- "Human" + "Computer" = {"name": "Programmer", "emoji": "👨‍💻"}
- "Sea" + "Engine" = {"name": "Submarine", "emoji": "🛳️"}

Now combine "${element1}" and "${element2}". Return only the JSON:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extract JSON from the response (in case there's extra text)
    // Try to find JSON object in the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    
    // If no match, try removing markdown code blocks
    if (!jsonMatch) {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    }
    
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response:", text);
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", jsonMatch[0], parseError);
      return null;
    }

    if (parsed.name && parsed.emoji) {
      return {
        name: parsed.name,
        emoji: parsed.emoji,
      };
    }

    return null;
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
}

