import { AIImportedQuestion, AIExtractedLME } from "../types";
import JSON5 from 'json5';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      enunciado: { type: Type.STRING, description: "Texto da questão" },
      alternativas: { type: Type.ARRAY, items: { type: Type.STRING } },
      gabarito: { type: Type.STRING, description: "Letra A, B, C, D ou E" },
      comentario: { type: Type.STRING, description: "Explicação detalhada" },
      categoria: { type: Type.STRING },
      subcategoria: { type: Type.STRING },
      dificuldade: { type: Type.STRING },
      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["enunciado", "alternativas", "gabarito", "comentario"]
  }
};


interface Chat {
  history: { role: 'user' | 'model', parts: { text: string }[] }[];
  sendMessage(params: { message: string }): Promise<{ text?: string }>;
  sendMessageStream(params: { message: string }): AsyncGenerator<{ text?: string }>;
}

function repairTruncatedJson(json: string): string {
    let stack: string[] = [];
    let inString = false;
    let escaped = false;
    for (let i = 0; i < json.length; i++) {
        const char = json[i];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
            if (char === '{' || char === '[') stack.push(char);
            else if (char === '}' || char === ']') stack.pop();
        }
    }
    let repaired = json;
    if (inString) repaired += '"';
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') repaired += '}';
        else if (last === '[') repaired += ']';
    }
    return repaired;
}

function robustJsonParse<T>(jsonString: string): T {
  let processedString = jsonString.trim();
  processedString = processedString.replace(/```json\s*|```/g, '').trim();
  const firstBracket = Math.min(
    processedString.indexOf('[') === -1 ? Infinity : processedString.indexOf('['),
    processedString.indexOf('{') === -1 ? Infinity : processedString.indexOf('{')
  );
  if (firstBracket !== Infinity) processedString = processedString.substring(firstBracket);
  try {
    return JSON.parse(processedString);
  } catch (e1) {
    try { return JSON5.parse(processedString); }
    catch (e2) {
        try { return JSON5.parse(repairTruncatedJson(processedString)); }
        catch (e3) { throw new Error(`Erro de parser: ${jsonString.substring(0, 100)}...`); }
    }
  }
}

export const processFileQuestions = async (
    fullContent: string, 
    customPrompt?: string, 
    onProgress?: (p: number, t: number) => void, 
    images: string[] = [], 
    questionCount?: number, 
    mode: 'extract' | 'generate' = 'extract', 
    sourceType: 'exam' | 'study' = 'exam'
): Promise<AIImportedQuestion[]> => {
  const prompt = `
    Analise o conteúdo abaixo e processe as questões rigorosamente conforme solicitado.
    Modo: ${mode} (extract = CÓPIA CIRÚRGICA ABSOLUTA E TOTAL, sem pular ou resumir DE FORMA ALGUMA; generate = criação didática e inteligente baseada ESPECIFICAMENTE no conteúdo fornecido).
    Tipo: ${sourceType} (exam = EXTRAÇÃO ESTRUTURAL COMPLETÍSSIMA DA PROVA. study = criação rigorosa da EXATA quantidade de questões requisitadas).
    
    ${customPrompt ? `Instrução adicional do usuário: "${customPrompt}"` : ''}
    
    Conteúdo Original:
    ${fullContent}
    
    REGRAS CRÍTICAS INEGOCIÁVEIS:
    1. EXAUSTÃO NUMÉRICA: NUNCA pule ou omita nenhuma questão. Extraia ABSOLUTAMENTE TODAS as questões indicadas no conteúdo. Retenha o prefixo original da numeração no corpo da questão.
    2. FIDELIDADE CONTEXTUAL: Textos de apoio que servem de base para respostas DEVEM ser unidos ao topo do \`enunciado\` de todas as questões dependentes.
    3. EXATIDÃO DO GABARITO: O valor final do campo "gabarito" DEVE referenciar a exata alternativa correta apontada no "comentario". Não crie gabaritos incoerentes que contrariam sua própria análise.
    4. NÃO INVENTE: Em modo 'extract', não extraia "falsas questões", apenas identifique as perguntas genuínas. As alternativas devem constar EXATAMENTE do jeito original, mas você pode abstrair as letras avulsas \`A), B)\` e guardar a alternativa no array.
    5. IDENTIFICAÇÃO VISUAL ABSOLUTA (TAG): Sempre que o corpo da questão, do texto-base (enunciado completo) exigir que o usuário analise criticamente alguma "imagem", "tabela", "gráfico", "ressonância" e for imprescindível pra responder, VOCÊ É OBRIGADO a gravar a string literal "[ANEXAR_IMAGEM_MANUAL]" NO FINAL EXATO da resposta text do seu campo de \`comentario\`. Isso avisará o sistema.
    
    Retorne APENAS um array JSON válido e estrito no formato abaixo (sem markdown adicional):
    [{ "enunciado": "texto completo e denso incluindo o caso de introdução", "alternativas": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"], "gabarito": "A", "comentario": "Justificativa lógica forte. Se a imagem é cobrada: ... [ANEXAR_IMAGEM_MANUAL]", "categoria": "C1", "subcategoria": "S1", "dificuldade": "Médio", "tags": ["t1"] }]
  `;

  const contents: any[] = [prompt];
  if (images && images.length > 0) {
    images.forEach(imgBase64 => {
      contents.push({
        inlineData: {
          data: imgBase64,
          mimeType: "image/jpeg"
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: questionSchema,
      temperature: 0.1
    }
  });
  
  return robustJsonParse<AIImportedQuestion[]>(response.text || '');
};

export const explainWrongAlternatives = async (question: any): Promise<string> => {
    const prompt = `
        Explique detalhadamente por que as alternativas incorretas desta questão estão erradas e por que a correta é a certa.
        Questão: ${JSON.stringify(question)}
    `;
    const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
    });
    return response.text || '';
};

export const generateQuestionsFromPrompt = async (prompt: string): Promise<AIImportedQuestion[]> => {
  const fullPrompt = `${prompt}\n\nRetorne APENAS um array JSON de questões com o seguinte formato: [{ "enunciado": "texto da questão", "alternativas": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"], "gabarito": "A", "comentario": "explicação detalhada", "categoria": "Temática principal", "subcategoria": "Subtema", "dificuldade": "Médio", "tags": ["tag1"] }].`;
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: fullPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: questionSchema,
      temperature: 0.1
    }
  });
  return robustJsonParse<AIImportedQuestion[]>(response.text || '');
};

export const generateFlashcardFromQuestion = async (statement: string, explanation: string): Promise<{ front: string; back: string }> => {
  const prompt = `
    Crie um flashcard (frente e verso) a partir desta questão e explicação.
    Questão: ${statement}
    Explicação: ${explanation}
    
    Retorne APENAS um JSON: { "front": "pergunta curta", "back": "resposta concisa" }
  `;
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING }
        },
        required: ["front", "back"]
      }
    }
  });
  return robustJsonParse<{ front: string; back: string }>(response.text || '');
};

export const generateFlashcardsFromPrompt = async (topicPrompt: string, count: number): Promise<{ front: string; back: string }[]> => {
  const prompt = `Crie exatamente ${count} flashcards (frente e verso) sobre o seguinte tema / instruções: "${topicPrompt}". Foque nos conceitos mais importantes para estudo. Use perguntas curtas e diretas na frente, e respostas concisas e certeiras no verso.`;
  
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });
  return robustJsonParse<{ front: string; back: string }[]>(response.text || '');
};

export const summarizeContent = async (text: string): Promise<string> => {
  const prompt = `Resuma o conteúdo médico abaixo de forma estruturada e didática:\n\n${text}`;
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
  });
  return response.text || '';
};

export const explainFlashcardContext = async (front: string, back: string): Promise<string> => {
  const prompt = `Como um mentor médico especialista, explique de forma aprofundada o contexto clínico, fisiopatologia ou mecanismos relevantes que conectam a seguinte pergunta do flashcard à sua resposta. Mantenha um tom didático, mas vá DIRETO AO PONTO. NÃO faça nenhuma introdução ou saudação. NÃO use Markdown (como **, ##, etc). Formate toda a resposta APENAS utilizando tags em HTML puro (como <p>, <strong>, <ul>, <li>).\n\nPergunta (Frente):\n${front}\n\nResposta (Verso):\n${back}`;
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
  });
  return response.text || '';
};

export const extractLmeData = async (medicalRecord: string, diseaseType: string): Promise<AIExtractedLME> => {
  const prompt = `
    Extraia dados para Laudo de Solicitação de Medicamento (LME) de ${diseaseType} do prontuário: ${medicalRecord}.
    
    Retorne um JSON com o seguinte formato:
    {
      "cid10": "código CID",
      "anamnese_lme": "anamnese",
      "historia_clinica": "história clínica",
      "tratamentos_previos": "tratamentos",
      "tratamento_atual": "atual"
    }
  `;
  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cid10: { type: Type.STRING },
          anamnese_lme: { type: Type.STRING },
          historia_clinica: { type: Type.STRING },
          tratamentos_previos: { type: Type.STRING },
          tratamento_atual: { type: Type.STRING }
        },
        required: ["cid10", "anamnese_lme", "historia_clinica", "tratamentos_previos", "tratamento_atual"]
      }
    }
  });
  return robustJsonParse<AIExtractedLME>(response.text || '');
};

export const createNeuroChat = (): Chat => {
  let chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
  
  const sendMessage = async (params: { message: string }): Promise<{ text?: string }> => {
    const chat = ai.chats.create({
        model: DEFAULT_MODEL,
        history: chatHistory,
    });
    const response = await chat.sendMessage({ message: params.message });
    const text = response.text || '';
    chatHistory.push({ role: 'user', parts: [{ text: params.message }] }, { role: 'model', parts: [{ text }] });
    return { text };
  };
  
  async function* sendMessageStream(params: { message: string }): AsyncGenerator<{ text?: string }> {
    const chat = ai.chats.create({
        model: DEFAULT_MODEL,
        history: chatHistory,
    });
    const stream = await chat.sendMessageStream({ message: params.message });
    let accumulatedText = '';
    
    for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        accumulatedText += chunkText;
        yield { text: chunkText };
    }
    
    chatHistory.push(
      { role: 'user', parts: [{ text: params.message }] },
      { role: 'model', parts: [{ text: accumulatedText }] }
    );
  }
  
  return { history: chatHistory, sendMessage, sendMessageStream };
};
