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
      enunciado: { type: Type.STRING, description: "Texto completo e limpo da questão." },
      alternativas: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Lista de opções (A, B, C, D, E)." 
      },
      gabarito: { type: Type.STRING, description: "Letra da alternativa correta." },
      comentario: { type: Type.STRING, description: "Justificativa técnica + Descrição/Interpretação da imagem se houver." },
      dificuldade: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING },
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, customPrompt, images } = await req.json();
    const ai = new GoogleGenAI({
      apiKey: Deno.env.get("API_KEY") || Deno.env.get("GOOGLE_API_KEY"),
    });

    const parts: any[] = [];
    if (images && Array.isArray(images)) {
        images.forEach((imgBase64: string, idx: number) => {
            parts.push({ text: idx === 0 ? "VISUAL DA PÁGINA ATUAL:" : "VISUAL DA PRÓXIMA PÁGINA (CONTEXTO):" });
            parts.push({ inlineData: { mimeType: "image/jpeg", data: imgBase64 } });
        });
    }
    if (content) parts.push({ text: `CONTEÚDO TEXTUAL (ATUAL + SEGUINTE):\n${content}` });

    let systemInstruction = `VOCÊ É UM EXTRATOR DE PROVAS MÉDICAS DE ALTA PERFORMANCE.
    
    ESTRATÉGIA DE JANELA DESLIZANTE:
    1. Você recebeu a PÁGINA ATUAL e a PÁGINA SEGUINTE.
    2. EXTRAIA apenas questões que COMEÇAM na PÁGINA ATUAL.
    3. RECONSTRUÇÃO: Se uma questão começar na PÁGINA ATUAL mas for cortada e continuar na PÁGINA SEGUINTE, use o texto da PÁGINA SEGUINTE para completá-la INTEGRALMENTE agora.
    4. ITENS FRAGMENTADOS: Se a PÁGINA ATUAL contiver apenas o final de uma questão que começou anteriormente, IGNORE-A (ela já foi processada no lote anterior).
    
    REGRAS DE IMAGEM:
    - Descreva imagens clínicas detalhadamente no campo "comentario".
    - Se a imagem for crucial e não estiver clara, adicione "[ANEXAR_IMAGEM_MANUAL]".
    
    FORMATO: Responda estritamente com o JSON Array.
    CONTEXTO ADICIONAL: ${customPrompt || 'Extração exaustiva.'}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.0,
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