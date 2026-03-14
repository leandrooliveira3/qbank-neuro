import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { statement, explanation } = await req.json();
    const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY") });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        role: "user", 
        parts: [{ text: `Transforme em flashcard estilo Anki. Frente: Pergunta Curta. Verso: Explicação Didática.\nENUNCIADO: ${statement}\nEXPLICAÇÃO: ${explanation}` }] 
      }],
      config: {
        systemInstruction: "Crie flashcards JSON com campos {front, back}. Foco em memorização ativa.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { front: { type: Type.STRING }, back: { type: Type.STRING } },
          required: ["front", "back"]
        },
        temperature: 1.0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return new Response(response.text, { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});