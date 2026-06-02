import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

declare const process: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SYSTEM_INSTRUCTION = "Você é um preceptor acadêmico de neurologia sênior. Responda de forma técnica, baseada em evidências, mas altamente didática.";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { history, newMessage, stream: clientRequestedStream } = await req.json();
    
    // Forçamos stream = false independentemente do pedido do cliente para estabilidade em rede fixa
    const useStream = false; 

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const contents = Array.isArray(history) ? [...history] : [];
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    // Resposta atômica: Mais estável para Vercel -> Redes Fixas BR
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return new Response(JSON.stringify({ text: response.text || "" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  }
});