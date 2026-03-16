
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

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
      enunciado: { 
        type: Type.STRING, 
        description: "Texto completo e limpo da questão. DEVE conter o texto integral do Caso Clínico de base se a questão fizer parte de um bloco." 
      },
      alternativas: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Lista de 5 opções (A, B, C, D, E)." 
      },
      gabarito: { type: Type.STRING, description: "Apenas a letra (A, B, C, D ou E)." },
      comentario: { type: Type.STRING, description: "Justificativa técnica da alternativa correta." },
      justificativa_incorretas: { 
          type: Type.STRING, 
          description: "Justificativa curta para cada alternativa errada, no formato A) motivo B) motivo..." 
      },
      dificuldade: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING },
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario", "justificativa_incorretas"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { content, customPrompt, images } = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts: any[] = [];
    if (images && Array.isArray(images)) {
        images.forEach((imgBase64: string, idx: number) => {
            parts.push({ text: idx === 0 ? "CONTEÚDO VISUAL DA PÁGINA ATUAL:" : "CONTEÚDO VISUAL DA PÁGINA SEGUINTE (APENAS CONTEXTO):" });
            parts.push({ inlineData: { mimeType: "image/jpeg", data: imgBase64 } });
        });
    }
    if (content) parts.push({ text: `TEXTO INTEGRAL (ATUAL + SEGUINTE):\n${content}` });

    let systemInstruction = `VOCÊ É UM TRANSCRITOR MÉDICO CIRÚRGICO DE ALTA PRECISÃO ESPECIALIZADO EM PROVAS DE RESIDÊNCIA.
    
    REGRA DE OURO DO CONTEXTO CLÍNICO (CRÍTICO):
    - Frequentemente, um documento apresenta um "Caso Clínico" base (ex: Paciente de X anos...) seguido de várias perguntas relacionadas (ex: 1) Qual o diagnóstico?, 2) Como tratar?).
    - Você DEVE identificar o texto do Caso Clínico base que precede as questões numeradas.
    - É PROIBIDO retornar o enunciado de uma questão sem o seu Caso Clínico correspondente (caso ela o apresente)
    - O campo 'enunciado' de CADA sub-questão DEVE ser composto por: [Texto Integral do Caso Clínico] + [Texto da Pergunta Específica].
    - Exemplo: Se o caso é "Paciente com febre" e a pergunta 1 é "Qual o germe?", o enunciado final da questão 1 deve ser o "Paciente com febre. Qual o germe?".
    - Em alguns arquivos, o caso clínico pode estar na página anterior e a pergunta com suas alternativas em outra página, NÃO IGNORE O CASO SE ISSO ACONTECER e mantenha a logica acima. 
    - NÃO IGNORE NENHUMA QUESTÃO DO DOCUMENTO, MESMO SE NÃO HOUVER UM CASO CLINICO CORRESPONDENTE, existem questões que são conceituais. 
    
    ESTRATÉGIA DE SEGURANÇA ANTIDUPLICAÇÃO:
    1. Você recebeu o conteúdo de DUAS páginas (Atual e Seguinte).
    2. Use o texto da PÁGINA SEGUINTE apenas para completar uma questão ou caso que foi cortado no fim da página atual.
    3. Transcreva APENAS o caso clínico (SE INICIADO NA PAGINA ANTERIOR) + as questões que COMEÇAM fisicamente na PÁGINA ATUAL.
    
    REGRAS DE FORMATO:
    - Traduza tudo para Português do Brasil (pt-BR).
    - Remova apenas prefixos redundantes como "Question 1:", mas MANTENHA o conteúdo clínico integral.
    - Retorne estritamente um JSON Array.
    
    INSTRUÇÃO ADICIONAL DO USUÁRIO: ${customPrompt || 'Extração fiel ao documento mantendo contexto.'}`;

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
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }
});
