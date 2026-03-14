
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING },
      enunciado: { type: Type.STRING },
      alternativas: { type: Type.ARRAY, items: { type: Type.STRING } },
      gabarito: { type: Type.STRING },
      comentario: { type: Type.STRING },
      dificuldade: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
      ano: { type: Type.STRING },
      instituicao: { type: Type.STRING }
    },
    required: ["categoria", "enunciado", "alternativas", "gabarito", "dificuldade"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, modelChoice } = await req.json();
    const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY") });
    
    const finalInstruction = `Você é um robô extrator de JSON especializado em Provas de Residência.
    
    REGRAS DE EXTRAÇÃO:
    - Extraia apenas questões completas.
    - Se encontrar apenas o FINAL de uma questão, IGNORE-A.
    - REMOVA prefixos de letras (A, B, C...) do campo 'alternativas'. Deixe apenas o texto.`;

    const response = await ai.models.generateContent({
      model: modelChoice || "gemini-3-flash-preview", 
      contents: [{ 
        role: "user", 
        parts: [{ text: `Extraia questões deste texto:\n\n${content}` }] 
      }],
      config: {
        systemInstruction: finalInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    return new Response(response.text, { 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
