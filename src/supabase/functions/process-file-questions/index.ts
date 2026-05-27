
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "npm:@google/genai";

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
      enunciado: { type: Type.STRING, description: "Texto completo da questão, incluindo obrigatoriamente o caso clínico de base." },
      alternativas: { type: Type.ARRAY, items: { type: Type.STRING } },
      gabarito: { type: Type.STRING, description: "Letra A, B, C, D ou E" },
      comentario: { type: Type.STRING, description: "Explicação técnica detalhada em nível de especialista." },
      dificuldade: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING },
      analise_radiologica: { type: Type.STRING, description: "OBRIGATÓRIO SE HOUVER IMAGEM: Descreva os achados visuais com terminologia radiológica técnica. SE NÃO HOUVER IMAGEM, DEIXE EM BRANCO ou NULL." },
      indice_imagem_referencia: { type: Type.INTEGER, description: "ÍNDICE da imagem (0-N). NULL se texto puro." },
      coordenadas_recorte: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "[ymin, xmin, ymax, xmax] 0-1000. Capture a FIGURA E A LEGENDA." },
      suporte_texto: { type: Type.STRING, description: "Se a questão exigir leitura de um trecho específico, coloque o trecho AQUI, não no enunciado." }
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario"],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, customPrompt, images, questionCount, sourceType } = await req.json(); 
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const parts: any[] = [];
    
    if (images && Array.isArray(images)) {
      images.forEach((imgBase64: string, index: number) => {
        parts.push({ text: `IMAGEM_INDEX_${index}:` });
        parts.push({ inlineData: { mimeType: "image/jpeg", data: imgBase64 } });
      });
    }

    if (content) parts.push({ text: `CONTEÚDO TÉCNICO DE REFERÊNCIA:\n${content}` });

    const targetCount = questionCount || 5;
    let finalInstruction = "";

    if (sourceType === 'exam') {
        finalInstruction = `ATUE COMO: Um motor de OCR e Extração de Estrutura de Provas de Alta Precisão. 
        
        REGRA CRÍTICA DE CONTEXTO E CONSISTÊNCIA: 
        - Você deve detectar descrições de "Casos Clínicos" que precedem uma ou mais perguntas. 
        - O texto do caso clínico DEVE ser incorporado ao enunciado de cada pergunta que se refere a ele.
        - Não retorne apenas a pergunta final. Una o contexto à pergunta.
        - GABARITO: O valor do campo "gabarito" (Ex: "A", "B", "C", "D" ou "E") deve ser OBRIGATORIAMENTE a mesma letra que o campo "comentario" indica como correta. NUNCA gere "gabarito": "E" se o comentário diz que a correta é "B". Revise a prova textual se necessário.
        
        DIRETRIZ DE FRAGMENTAÇÃO:
        - Se encontrar apenas o FINAL de uma questão, IGNORE-A.
        - Extraia apenas questões com ENUNCIADO COMPLETO neste bloco.`;
    } else {
        finalInstruction = `ATUE COMO: Banca Examinadora Médica de Especialidade. Crie ${targetCount} questões inéditas de alto nível baseadas no conteúdo fornecido.
        
        REGRA DE CONSISTÊNCIA ABSOLUTA: O campo "gabarito" DEVE refletir perfeitamente a alternativa indicada como correta no campo "comentario". Nunca crie um gabarito contraditório.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: finalInstruction,
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 8192, 
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
