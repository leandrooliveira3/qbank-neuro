
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { GoogleGenAI, Type } from "npm:@google/genai";

declare const process: any;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const classificationSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "O identificador original da questão." },
      category: { 
        type: Type.STRING, 
        description: "A grande área da Neurologia (ex: Neurovascular, Epilepsia, Neuromuscular)." 
      },
      subcategory: { 
        type: Type.STRING, 
        description: "O diagnóstico específico ou síndrome (ex: AVC Isquêmico, Miastenia Gravis, Enxaqueca com Aura)." 
      },
    },
    required: ["id", "category", "subcategory"],
  },
};

const SYSTEM_INSTRUCTION = `Você é um Preceptor Sênior de Neurologia e Taxonomista Clínico.
Seu objetivo é classificar questões médicas EXCLUSIVAMENTE dentro da árvore de conhecimento da NEUROLOGIA.

TAXONOMIA OBRIGATÓRIA (Use apenas estas Categorias):
1. Neurovascular (AVC, AIT, Hemorragias, TVC)
2. Epilepsia (Crises, Síndromes, EAM)
3. Cefaleias & Dor (Migrânea, Tensional, Trigeminal)
4. Distúrbios do Movimento (Parkinson, Tremor, Coreia, Ataxias)
5. Neuromuscular (ELA, Miastenia, Neuropatias, Miopatias)
6. Neuroimunologia (Esclerose Múltipla, NMOSD, MOGAD)
7. Neuroinfecção (Meningites, Abscessos, Virais, HIV/SNC)
8. Neurocognição (Alzheimer, DFT, Delirium)
9. Neurointensivismo (Coma, HIC, Morte Encefálica)
10. Neuroftalmologia (Neurite, Diplopia, Papiledema)
11. Neuro-Oncologia (Tumores, Paraneoplásicas)
12. Sono (Apneia, Narcolepsia, Insônia)
13. Neurogenética (Canalopatias, Doenças Hereditárias)
14. Neurologia Geral (Semiologia, Topografia, se não couber acima)

REGRAS:
- SUBCATEGORIA: Seja específico (ex: use "AVC Isquêmico" em vez de apenas "Vascular").
- Se a questão for de Clínica Médica mas tiver viés neurológico, classifique na Neurologia (ex: Lupus com Coreia -> Distúrbios do Movimento).
- Se a questão for totalmente fora da neuro (ex: Infarto do Miocárdio puro), use Categoria: "Outros" e Subcategoria: "Geral".
- Responda estritamente com o JSON Array.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  try {
    const { questions } = await req.json();
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error("Nenhuma questão enviada para processamento.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Filtramos apenas o essencial para economizar tokens
    const promptData = questions.map(q => ({ id: q.id, text: q.statement?.substring(0, 1000) }));
    const prompt = `Classifique estas questões na taxonomia de Neurologia:\n\n${JSON.stringify(promptData)}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: classificationSchema,
        temperature: 0.0, // Máxima precisão
      }
    });

    const text = response.text || "[]";

    return new Response(text, { 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });

  } catch (error: any) {
    console.error("[EDGE ERROR]", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" } 
    });
  }
});
