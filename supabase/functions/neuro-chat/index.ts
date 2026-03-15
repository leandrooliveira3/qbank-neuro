import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

declare const Deno: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SYSTEM_INSTRUCTION = "Você é um preceptor acadêmico de neurologia sênior. Responda de forma técnica, baseada em evidências, mas altamente didática.";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { history, newMessage, stream } = await req.json();
    const ai = new GoogleGenAI({ apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY") });

    const contents = Array.isArray(history) ? [...history] : [];
    contents.push({ role: 'user', parts: [{ text: newMessage }] });

    if (stream) {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.4,
      topP: 0.9,
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 }
        }
      });

const encoder = new TextEncoder();

const readableStream = new ReadableStream({
  async start(controller) {
    try {
      for await (const chunk of responseStream) {
        const text = chunk?.text;

        if (!text) continue;

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
        );

        // força flush do stream
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();

    } catch (error) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`)
      );
      controller.close();
    }
  },
});

return new Response(readableStream, {
  headers: {
    ...CORS_HEADERS,
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  },
});
    } else {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 1.0,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return new Response(JSON.stringify({ text: response.text || "" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  }
});