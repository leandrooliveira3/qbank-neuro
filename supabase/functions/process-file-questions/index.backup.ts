
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "npm:@google/genai";

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
      gabarito: { type: Type.STRING, description: "Letra da alternativa correta (A, B, C, D ou E)" },
      comentario: { type: Type.STRING, description: "Justificativa técnica detalhada" },
      dificuldade: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      analise_radiologica: { type: Type.STRING, description: "Descrição técnica dos achados na imagem" },
      indice_imagem_referencia: { type: Type.INTEGER, description: "ÍNDICE OBRIGATÓRIO (0-N) da página onde está a imagem desta questão. Use null se não houver imagem." },
      coordenadas_recorte: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Bounding box [ymin, xmin, ymax, xmax] 0-1000 cobrindo TODA a figura citada. OBRIGATÓRIO se houver imagem." }
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario", "dificuldade", "categoria"],
  },
};

const SYSTEM_INSTRUCTION = `Você é um robô de digitalização médica ultra-preciso. Seu objetivo é converter PDFs de provas em um banco de dados estruturado.

REGRAS CRÍTICAS DE EXTRAÇÃO:
1. EXTRAÇÃO COMPLETA: Percorra o documento até o fim. Extraia TODAS as questões. Não pule nenhuma por brevidade.
2. VÍNCULO VISUAL OBRIGATÓRIO: 
   - Sempre que o enunciado citar "figura", "imagem", "tomografia", "ressonância" ou "exame", você DEVE localizar visualmente a imagem na página.
   - Retorne o 'indice_imagem_referencia' (página 0-N) e 'coordenadas_recorte' [ymin, xmin, ymax, xmax] em escala 0-1000.
   - Seja generoso no recorte: capture a imagem inteira e sua legenda se houver.
3. GERAÇÃO (LIVROS): Se for conteúdo teórico, gere 3 questões de alto nível (residência médica) por página. Use as imagens do livro para criar questões baseadas em casos visuais.
4. FORMATO: Responda APENAS com o JSON Array. Nunca interrompa o JSON pela metade.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, customPrompt, images } = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [];
    if (content) parts.push({ text: `TEXTO EXTRAÍDO (OCR):\n${content}` });

    if (images && Array.isArray(images)) {
      images.forEach((imgBase64: string, index: number) => {
        // CORREÇÃO: Partes separadas para texto e imagem
        parts.push({ text: `CONTEÚDO VISUAL DA PÁGINA ${index}:` });
        parts.push({ inlineData: { mimeType: "image/jpeg", data: imgBase64 } });
      });
    }

    parts.push({ text: `INICIE O PROCESSAMENTO. Identifique cada item e mapeie as imagens radiológicas com coordenadas exatas. Instruções: ${customPrompt || 'Digitalização exaustiva'}` });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.1,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      }
    });

    return new Response(response.text, { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
