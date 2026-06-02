
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const Deno: any;
declare const process: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { question } = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const altsStr = question.alternatives.map((a: any, i: number) => `${String.fromCharCode(65+i)}) ${a.text} ${a.is_correct ? '(CORRETA)' : '(INCORRETA)'}`).join('\n');
    
    const prompt = `Atue como um Tutor IA Médico encorajador, moderno e didático.
    Analise a seguinte questão e as alternativas fornecidas.
    Forneça uma explicação acolhedora e agradável justificando o erro para cada uma das alternativas INCORRETAS.
    
    REGRAS CRÍTICAS:
    1. Utilize formatação rica em Markdown, como **negritos** para destacar diagnóstico, exames ou palavras-chave cruciais.
    2. Utilize emojis contextualizados (💡, ⚠️, 📌, 🧠, etc) para deixar o texto leve e engajador.
    3. Use marcadores (bullet points) caso queira listar critérios ou dicas.
    4. OBRIGATÓRIO: Use quebras de linha claras entre cada alternativa para facilitar a leitura.
       Exemplo:
       **A)** Motivo pedagógico e amigável...
       
       **B)** Motivo pedagógico e amigável...
       
    5. NÃO utilize introduções longas ("Olá", "Aqui estão as..."). Vá direto para as letras das alternativas.
    
    QUESTÃO: ${question.statement}
    ALTERNATIVAS:
    ${altsStr}
    
    EXPLICAÇÃO ORIGINAL GABARITO (PARA CONTEXTO): ${question.explanation}
    
    Gere um texto rico em Markdown e de fácil leitura.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
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
