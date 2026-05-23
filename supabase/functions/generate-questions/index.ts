
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const Deno: any;
declare const process: any;

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
      gabarito: { type: Type.STRING, description: "A letra da alternativa correta (A, B, C, D ou E)" },
      comentario: { type: Type.STRING, description: "Justificativa clínica profunda" },
      justificativa_incorretas: { type: Type.STRING, description: "Análise técnica das alternativas falsas." },
      dificuldade: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["categoria", "enunciado", "alternativas", "gabarito", "comentario", "justificativa_incorretas", "dificuldade"],
  },
};

const SYSTEM_INSTRUCTION = `Você é um Professor Titular de Medicina. 
Sua missão é projetar questões de alto nível técnico.

REGRAS:
- Para cada questão, gere justificativas para as alternativas erradas.
- Sempre em Português do Brasil (pt-BR).
- 'alternativas' deve conter APENAS o texto das opções, sem prefixos (A, B...).
- CONSISTÊNCIA OBRIGATÓRIA: O campo 'gabarito' DEVE ESPELHAR a letra da alternativa que você defende como correta no campo 'comentario'. Não gere um JSON onde o gabarito é 'A' mas o comentário diz que a certa é 'C'.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { prompt } = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return new Response(response.text, { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
