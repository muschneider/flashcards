import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type RequestBody = {
  type: "word_example" | "sentence_hint";
  word?: string;
  sentence?: string;
  portuguese?: string;
};

function buildPrompt(body: RequestBody): string {
  if (body.type === "word_example") {
    return `You are an English language tutor helping a Portuguese speaker learn English.

Give 2 short, simple example sentences using the English word "${body.word}" (which means "${body.portuguese}" in Portuguese).

Format:
1. [sentence] - [Portuguese translation]
2. [sentence] - [Portuguese translation]

Keep sentences simple and appropriate for a beginner learner. Be concise.`;
  }

  return `You are an English language tutor helping a Portuguese speaker learn English.

The student is learning this English sentence: "${body.sentence}"
Portuguese translation: "${body.portuguese}"

Give a brief, helpful tip (2-3 sentences max) about:
- A grammar point or pattern used in the sentence
- A memory aid to remember the word order
- Or a cultural/contextual note

Write your tip in Portuguese to help the student understand. Be concise and friendly.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!GEMINI_API_KEY) {
      // Return a helpful fallback when no API key is configured
      if (body.type === "word_example") {
        return NextResponse.json({
          result: `Example sentences for "${body.word}":\n1. I like the ${body.word}. - Eu gosto do/da ${body.portuguese}.\n2. The ${body.word} is beautiful. - O/A ${body.portuguese} é bonito/a.\n\n(Set GEMINI_API_KEY for AI-generated examples)`,
        });
      }
      return NextResponse.json({
        result: `Dica: Preste atenção na ordem das palavras em inglês - geralmente é Sujeito + Verbo + Objeto. Compare com a tradução em português para ver as diferenças.\n\n(Configure GEMINI_API_KEY para dicas personalizadas com IA)`,
      });
    }

    const prompt = buildPrompt(body);

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error("Gemini route error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 },
    );
  }
}
