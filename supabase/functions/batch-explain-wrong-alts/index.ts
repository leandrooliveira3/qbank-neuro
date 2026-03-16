
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const process: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const explanationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "ID original da questão." },
      wrong_explanations: { 
        type: Type.STRING, 
        description: "Justificativa curta para cada alternativa errada (A, B, C...). Pule a correta. SEMPRE pule linha entre elas." 
      },
    },
    required: ["id", "wrong_explanations"],
  },
};

const SYSTEM_INSTRUCTION = `Você é um Preceptor de Residência Médica. 
Sua tarefa é analisar lotes de questões e fornecer justificativas técnicas concisas para as alternativas INCORRETAS.

REGRAS:
1. Formato de resposta: Cada alternativa em uma nova linha.
   A) Motivo...
   B) Motivo...
2. Não explique a alternativa correta.
3. Seja direto e acadêmico. 
4. Retorne Stritamente o JSON Array conforme o esquema fornecido.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { questions } = await req.json();
    if (!questions || !Array.isArray(questions)) throw new Error("Entrada inválida.");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const batchData = questions.map(q => ({
      id: q.id,
      statement: q.statement,
      alternatives: q.alternatives.map((a: any, i: number) => `${String.fromCharCode(65+i)}) ${a.text} ${a.is_correct ? '(CORRETA)' : '(INCORRETA)'}`)
    }));

    const prompt = `Gere justificativas para as alternativas INCORRETAS. Use obrigatoriamente quebras de linha entre elas:\n\n${JSON.stringify(batchData)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: explanationSchema,
        temperature: 0.1,
      }
    });

    return new Response(response.text, { 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  }
});
