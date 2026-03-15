import { AIImportedQuestion, AIExtractedLME } from "../types";
import { supabase } from './supabase';
import JSON5 from 'json5';

const SUPABASE_FUNCTIONS_BASE_URL = 'https://azigaziisnjguakkajza.supabase.co/functions/v1';

interface Chat {
  history: { role: 'user' | 'model', parts: { text: string }[] }[];
  sendMessage(params: { message: string }): Promise<{ text?: string }>;
  sendMessageStream(params: { message: string }): AsyncGenerator<{ text?: string }>;
}

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
};

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
  const headers = await getAuthHeaders();
  const functionEndpoint = sourceType === 'exam' ? 'process-exam-mode' : 'process-study-mode';
  const payload = JSON.stringify({ content: fullContent, customPrompt, images, questionCount });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 110000);
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/${functionEndpoint}`, {
      method: 'POST', headers, body: payload, signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Erro na função ${functionEndpoint}`);
    return robustJsonParse<AIImportedQuestion[]>(await response.text());
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
};

export const explainWrongAlternatives = async (question: any): Promise<string> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/explain-wrong-alts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question }),
    });
    if (!response.ok) throw new Error("Falha na IA ao explicar alternativas.");
    const data = await response.json();
    return data.explanation;
};

export const generateQuestionsFromPrompt = async (prompt: string): Promise<AIImportedQuestion[]> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/generate-questions`, {
    method: 'POST', headers, body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error(await response.text());
  return robustJsonParse<AIImportedQuestion[]>(await response.text());
};

export const generateFlashcardFromQuestion = async (statement: string, explanation: string): Promise<{ front: string; back: string }> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/generate-flashcard`, {
    method: 'POST', headers, body: JSON.stringify({ statement, explanation }),
  });
  if (!response.ok) throw new Error(await response.text());
  return robustJsonParse<{ front: string; back: string }>(await response.text());
};

export const summarizeContent = async (text: string): Promise<string> => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/summarize-content`, {
    method: 'POST', headers, body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return data.summary;
};

export const extractLmeData = async (medicalRecord: string, diseaseType: string): Promise<AIExtractedLME> => {
  const prompt = `Extraia dados para LME de ${diseaseType} do prontuário: ${medicalRecord}`;
  const headers = await getAuthHeaders();
  const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/neuro-chat`, {
    method: 'POST', headers, body: JSON.stringify({ history: [], newMessage: prompt, stream: false }),
  });
  if (!response.ok) throw new Error("Falha ao analisar prontuário");
  const data = await response.json();
  return robustJsonParse<AIExtractedLME>(data.text);
};

export const createNeuroChat = (): Chat => {
  let chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [];
  
  const sendMessage = async (params: { message: string }): Promise<{ text?: string }> => {
    const headers = await getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/neuro-chat`, {
        method: 'POST', 
        headers, 
        body: JSON.stringify({ history: chatHistory, newMessage: params.message, stream: false }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      chatHistory.push({ role: 'user', parts: [{ text: params.message }] }, { role: 'model', parts: [{ text: data.text || '' }] });
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      throw err;
    }
  };
  
  async function* sendMessageStream(params: { message: string }): AsyncGenerator<{ text?: string }> {
    const headers = await getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_BASE_URL}/neuro-chat`, {
        method: 'POST', 
        headers, 
        body: JSON.stringify({ history: chatHistory, newMessage: params.message, stream: true }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      if (!response.body) throw new Error("Resposta sem corpo de stream");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';
      
while (true) {
  const { value, done } = await reader.read();
  if (done) break;

buffer += decoder.decode(value, { stream: true });

const events = buffer.split("\n\n");
buffer = events.pop() || "";

for (const event of events) {

  if (!event.startsWith("data:")) continue;

  const payload = event.replace("data:", "").trim();

  if (payload === "[DONE]") continue;

  try {
    const parsed = JSON.parse(payload);

    const textChunk =
      parsed?.text ??
      parsed?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "";

    if (!textChunk) continue;

    accumulatedText += textChunk;

    yield { text: textChunk };

  } catch {
    // ignora JSON incompleto
  }
}
      
      chatHistory.push({ role: 'user', parts: [{ text: params.message }] }, { role: 'model', parts: [{ text: accumulatedText }] });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      throw err;
    }
  }
  
  return { history: chatHistory, sendMessage, sendMessageStream };
};
