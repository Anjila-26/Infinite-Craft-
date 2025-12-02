import { NextRequest, NextResponse } from "next/server";
import { getRecipe } from "@/lib/recipes";
import { generateCraftResult } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { element1, element2 } = await request.json();

    if (!element1 || !element2) {
      return NextResponse.json(
        { error: "Both elements are required" },
        { status: 400 }
      );
    }

    // First, check if we have a predefined recipe
    const recipe = getRecipe(element1, element2);

    if (recipe) {
      return NextResponse.json({
        result: recipe.name,
        emoji: recipe.emoji,
        isNew: false,
      });
    }

    // No recipe found - use Gemini to generate a new combination
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not set, returning Nothing");
      return NextResponse.json({
        result: "Nothing",
        emoji: "❌",
        isNew: false,
      });
    }

    const geminiResult = await generateCraftResult(element1, element2);

    if (geminiResult) {
      return NextResponse.json({
        result: geminiResult.name,
        emoji: geminiResult.emoji,
        isNew: true, // This is a newly generated element
      });
    }

    // Gemini failed or returned nothing
    return NextResponse.json({
      result: "Nothing",
      emoji: "❌",
      isNew: false,
    });
  } catch (error) {
    console.error("Craft API error:", error);
    return NextResponse.json(
      { error: "Failed to process craft request" },
      { status: 500 }
    );
  }
}
