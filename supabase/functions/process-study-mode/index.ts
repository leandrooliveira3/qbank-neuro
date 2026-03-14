import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "npm:@google/genai";

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
      enunciado: { type: Type.STRING },
      alternativas: { type: Type.ARRAY, items: { type: Type.STRING } },
      gabarito: { type: Type.STRING },
      comentario: { type: Type.STRING, description: "Justificativa + Interpretação da Imagem se houver." },
      dificuldade: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING }
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario", "dificuldade", "categoria", "subcategoria"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, customPrompt, questionCount, images } = await req.json();
    const ai = new GoogleGenAI({
      apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY"),
    });

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
    
    REGRAS DE IMAGEM:
    - Se o material contiver imagens/gráficos, crie questões baseadas neles.
    - Inclua a análise detalhada da imagem no campo "comentario".
    - Se a questão for dependente de uma imagem visual que o aluno precisa ver, insira "[ANEXAR_IMAGEM_MANUAL]" no início do comentário.

    CONTEXTO: "${customPrompt || 'Gere questões de alto nível.'}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: finalInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.2,
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