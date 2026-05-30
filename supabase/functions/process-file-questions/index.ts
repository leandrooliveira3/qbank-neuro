
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
        finalInstruction = `Você é um motor de digitalização ultra-preciso (OCR) focado em estruturação de provas. MANTENHA A ORDEM EXATA DAS QUESTÕES.
        
        REGRAS CRÍTICAS DE EXTRAÇÃO:
        1. EXTRAÇÃO EXAUSTIVA E FIDELIDADE: Percorra o texto fornecido e extraia TODAS AS QUESTÕES PRESENTES, sem resumir, pular ou inventar. Nunca crie opções onde não existam. Apenas transcreva de forma estruturada.
        2. CASOS CLÍNICOS E TEXTOS-BASE: Textos de apoio que precedem perguntas DEVEM ser incluídos no início do \`enunciado\` de TODAS as questões relacionadas a ele. Não deixe a questão sem contexto.
        3. EXATIDÃO DO GABARITO: O valor do campo "gabarito" (Ex: "A") deve bater perfeitamente com a lógica e com o "comentario" gerado. Se o texto não fornecer gabarito, crie o comentário com a resolução correta e defina o gabarito.
        4. IMAGENS OBRIGATÓRIAS (TAG): Sempre que o enunciado de uma questão mencionar palavras como "figura", "imagem", "tabela", "gráfico", "achados", "ressonância", "eco", ou for impossível resolvê-la sem um anexo visual, você DEVE OBRIGATORIAMENTE INCLUIR A STRING "[ANEXAR_IMAGEM_MANUAL]" no FINAL DO TEXTO DO CAMPO \`comentario\`.
        5. RECORTES (OPCIONAL): Se você identificar o 'indice_imagem_referencia' correspondente, preencha as variáveis de recorte ('coordenadas_recorte'). No entanto, A TAG "[ANEXAR_IMAGEM_MANUAL]" deve ir pro comentário independentemente.`;
    } else {
        finalInstruction = `Você é uma Banca Examinadora Médica de Especialidade de Alto Nível (padrão Residência Médica).
        SEU OBJETIVO: Criar EXATAMENTE ${targetCount} questões inéditas, baseadas EXCLUSIVAMENTE no conteúdo teórico anexado.

        REGRAS ABSOLUTAS:
        1. CUMPRA A COTA: O array de saída do JSON deve ter RIGOROSAMENTE tamanho igual a ${targetCount}.
        2. QUALIDADE E PRECISÃO: Use casos clínicos formulados a partir do texto quando possível. As alternativas devem ser plausíveis.
        3. GABARITO PERFEITO: O 'gabarito' deve ser a mesma letra afirmada como correta no 'comentario'.
        4. USO DE IMAGENS: Se no texto-base houver descrições de imagens e você criar um caso baseado nisso que exigiria a visualização dessa figura pelo aluno, ADICIONE A TAG "[ANEXAR_IMAGEM_MANUAL]" NO FINAL DO SEU \`comentario\`.`;
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
