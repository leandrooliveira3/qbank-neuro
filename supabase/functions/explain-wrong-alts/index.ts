import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { question } = await req.json();
    const ai = new GoogleGenAI({
      apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY"),
    });

    const altsStr = question.alternatives.map((a: any, i: number) => `${String.fromCharCode(65+i)}) ${a.text} ${a.is_correct ? '(CORRETA)' : '(INCORRETA)'}`).join('\n');
    
    const prompt = `Atue como um preceptor médico sênior. 
    Analise a seguinte questão e as alternativas fornecidas.
    Forneça uma justificativa técnica curta para cada uma das alternativas INCORRETAS.
    
    REGRAS CRÍTICAS:
    1. NÃO utilize introduções como "Como preceptor...", "Aqui está a análise..." ou conclusões. Comece diretamente pela primeira letra.
    2. NÃO utilize negrito (ex: evite **A)**). Use apenas "A) texto".
    3. Foque no erro conceitual ou na diretriz clínica que invalida a opção.
    4. Mantenha um tom acadêmico e direto.
    
    QUESTÃO: ${question.statement}
    ALTERNATIVAS:
    ${altsStr}
    
    EXPLICAÇÃO ORIGINAL (PARA CONTEXTO): ${question.explanation}
    
    Responda em formato de texto limpo.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
      },
    });

    return new Response(JSON.stringify({ explanation: response.text }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});