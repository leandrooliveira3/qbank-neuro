import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SYSTEM_INSTRUCTION = `Você é um Assistente Acadêmico de Medicina de Elite. Analise o texto e crie um Resumo Estruturado Didático.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { text } = await req.json();
    const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY") });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: `Resuma o seguinte conteúdo médico:\n\n${text.substring(0, 100000)}` }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return new Response(JSON.stringify({ summary: response.text }), { 
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});