
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
      enunciado: { type: Type.STRING },
      alternativas: { type: Type.ARRAY, items: { type: Type.STRING } },
      gabarito: { type: Type.STRING },
      comentario: { type: Type.STRING, description: "Justificativa da alternativa correta." },
      justificativa_incorretas: { type: Type.STRING, description: "Por que cada uma das outras opções é falsa." },
      dificuldade: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING }
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario", "justificativa_incorretas", "dificuldade", "categoria", "subcategoria"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, customPrompt, questionCount, images } = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
        images.forEach((imgBase64: string, idx: number) => {
            parts.push({ text: `IMAGEM DE REFERÊNCIA (PÁGINA ${idx + 1}):` });
            parts.push({ inlineData: { mimeType: "image/jpeg", data: imgBase64 } });
        });
    }
    if (content) parts.push({ text: `MATERIAL DE ESTUDO:\n${content.substring(0, 30000)}` });

    const target = questionCount || 3;
    let finalInstruction = `ATUE COMO: Professor de Medicina de Especialidade.
    
    OBJETIVO: Criar ${target} questões baseadas no material.
    
    REQUISITOS TÉCNICOS:
    - Inclua justificativas para as alternativas erradas no campo 'justificativa_incorretas'.
    - Gere todo o conteúdo em Português do Brasil (pt-BR).
    - CONSISTÊNCIA OBRIGATÓRIA: O campo "gabarito" DEVE ter OBRIGATORIAMENTE a mesma letra da alternativa defendida como correta no campo "comentario". Nunca crie um gabarito conflitante com a explicação.
    
    CONTEXTO: "${customPrompt || 'Gere questões de alto nível.'}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: finalInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.1,
      },
    });

    return new Response(response.text, {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
