import { processFileQuestions } from './ai';
import * as pdfjsLib from 'pdfjs-dist';
import { useImportStore } from '../store/useImportStore';
import mammoth from 'mammoth';

if (typeof window !== 'undefined') {
    const version = pdfjsLib.version || '5.4.530';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
}

const MAX_RETRIES = 3;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class QuestionOrchestrator {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
    useImportStore.getState().reset();
  }

  public async processPDF(file: File, options: { sourceType: 'exam' | 'study', customPrompt?: string, totalQuestionsTarget?: number }): Promise<void> {
    const store = useImportStore.getState();
    this.isCancelled = false;
    const extension = file.name.split('.').pop()?.toLowerCase();

    store.updateProgress(0, `Iniciando motor de reconstrução de bordas...`);

    try {
        if (extension === 'pdf') {
            await this.handlePdfWithSlidingWindow(file, options, store);
        } else {
            const text = extension === 'docx'
                ? (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value
                : await file.text();
            await this.processLargeTextInSmallChunks(text, options, store);
        }

        if (!this.isCancelled) {
            store.finishProcess();
        }
    } catch (err: any) {
        if (!this.isCancelled) {
            console.error('Erro no processador:', err);
            store.addError(`Falha crítica: ${err.message}`);
            store.finishProcess();
        }
    } finally {
        if (this.isCancelled) {
            console.debug('Processamento abortado pelo usuário.');
        }
    }
  }

  private async handlePdfWithSlidingWindow(file: File, options: any, store: any) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    const questionsPerPage: number | undefined = options.sourceType === 'study'
        ? (options.totalQuestionsTarget || 3)
        : undefined;

    store.startProcess(totalPages);

    const PAGES_PER_BATCH = 2; // Process 2 pages at a time to reduce calls and tokens
    for (let i = 1; i <= totalPages; i += PAGES_PER_BATCH) {
        if (this.isCancelled) break;

        const endPage = Math.min(i + PAGES_PER_BATCH - 1, totalPages);

        let instruction = options.sourceType === 'study' ?
            `[INSTRUÇÃO ABSOLUTA: Se aplicável nas páginas ${i} a ${endPage}, gere rigorosamente EXATAMENTE ${questionsPerPage ?? 3} questão(ões) de múltipla escolha.
            REGRAS OBRIGATÓRIAS:
            1. NÃO INVENTE. Só faça perguntas cuja resposta está no texto/imagem fornecidos.
            2. TAG DE IMAGEM: Se a questão exige que o aluno veja a figura para poder responder, VOCÊ DEVE digitar "[ANEXAR_IMAGEM_MANUAL]" no final da string \`comentario\`.]` :
            `[INSTRUÇÃO ABSOLUTA: EXTRATOR CIRÚRGICO - EXTRAÇÃO COMPLETA
            Sua missão é extrair TODAS e SOMENTE as questões presentes nas PÁGINAS ${i} a ${endPage}.
            
            DIRETRIZES DE OURO:
            1. RECONHECIMENTO DE PADRÕES: Extraia a questão COM TODAS AS ALTERNATIVAS, não pule questões.
            2. INTEGRIDADE DA QUESTÃO: Se a questão for cortada entre páginas, junte o texto.
            3. SEM DUPLICAÇÃO E SEM INVENÇÃO.
            4. IMAGEM: OBRIGATORIAMENTE digite "[ANEXAR_IMAGEM_MANUAL]" no FINAL DO TEXTO em \`comentario\` para CADA questão que tiver figura referenciada.
            5. GABARITO E CONTEXTO: Enunciados com casos clínicos genéricos devem receber o caso em seu corpo. Retorne [] se não houver questão.
            6. MANTENHA O NÚMERO ORIGINAL DA QUESTÃO NO ENUNCIADO.]`;

        let contentPayload = `${instruction}\n`;
        const imagesPayload: string[] = [];

        for (let j = i; j <= endPage; j++) {
            const page = await pdf.getPage(j);
            const textContent = await page.getTextContent();
            const pageStr = textContent.items.map((item: any) => item.str).join(' ');
            
            contentPayload += `\n[PÁGINA: ${j} de ${totalPages}]\n${pageStr}`;

            const viewport = page.getViewport({ scale: 1.1 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (ctx) {
                await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                // Reduces quality to drastically save tokens per image
                imagesPayload.push(canvas.toDataURL('image/jpeg', 0.3).split(',')[1]);
            }
        }

        // Just append the next page's TEXT (no image) as context for cut-off questions
        if (endPage < totalPages && !this.isCancelled && options.sourceType === 'exam') {
            const nextPage = await pdf.getPage(endPage + 1);
            const nextTextContent = await nextPage.getTextContent();
            const nextStr = nextTextContent.items.map((item: any) => item.str).join(' ');
            contentPayload += `\n\n[PÁGINA SEGUINTE (SOMENTE PARA CONTINUAÇÃO DE TEXTO CORTADO): ${endPage + 1}]\n${nextStr}`;
        }

        if (!this.isCancelled) {
            store.updateProgress(endPage, `Lendo páginas ${i}-${endPage}...`);
            const qs = await this.callAiInternal(contentPayload, imagesPayload, `Págs ${i}-${endPage}`, options, store, questionsPerPage);
            
            if (this.isCancelled) break;

            if (qs && qs.length > 0) {
                store.addResults(qs);
                store.updateProgress(endPage, `Págs ${i}-${endPage}: +${qs.length} questão(ões).`);
            } else {
                store.updateProgress(endPage, `Págs ${i}-${endPage}: Processadas sem questões.`);
            }
        }
        
        await sleep(1500); 
    }
  }

  private async processLargeTextInSmallChunks(text: string, options: any, store: any) {
    const CHUNK_SIZE = 6000;
    const OVERLAP = 1500;

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        chunks.push(text.substring(i, i + CHUNK_SIZE + OVERLAP));
    }
    const totalChunks = chunks.length;
    store.startProcess(totalChunks);

    const questionsPerChunk: number | undefined = options.sourceType === 'study'
        ? (options.totalQuestionsTarget || 3)
        : undefined;

    for (let i = 0; i < totalChunks; i++) {
        if (this.isCancelled) break;

        store.updateProgress(i + 1, `Lendo Parte ${i + 1} de ${totalChunks}...`);
        const qs = await this.callAiInternal(chunks[i], [], `Parte ${i + 1}`, options, store, questionsPerChunk);
            
        if (this.isCancelled) break;

        if (qs && qs.length > 0) {
            store.addResults(qs);
            store.updateProgress(i + 1, `Parte ${i + 1}: +${qs.length} questão(ões).`);
        } else {
            store.updateProgress(i + 1, `Parte ${i + 1}: Processada sem questões.`);
        }
        
        await sleep(1000);
    }
  }

  // Returns array of questions, doesn't add to store directly, uses Promise.race for timeout
  private async callAiInternal(
    content: string,
    images: string[],
    label: string,
    options: any,
    store: any,
    questionsPerPage?: number
  ): Promise<any[]> {
    if (this.isCancelled) return [];

    let attempt = 0;
    while (attempt < MAX_RETRIES && !this.isCancelled) {
        attempt++;
        try {
            const timeoutPromise = new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_AI')), 50000));
            const aiPromise = processFileQuestions(
                content,
                options.customPrompt,
                undefined,
                images,
                questionsPerPage,
                'extract',
                options.sourceType
            );

            const aiQuestions = await Promise.race([aiPromise, timeoutPromise]);

            if (this.isCancelled) return [];

            if (aiQuestions && aiQuestions.length > 0) {
                const trimmed = questionsPerPage !== undefined
                    ? aiQuestions.slice(0, questionsPerPage)
                    : aiQuestions;
                return trimmed;
            }
            return [];
        } catch (e: any) {
            if (this.isCancelled) return [];
            console.warn(`[${label}] Tentativa ${attempt} falhou:`, e.message);
            if (attempt === MAX_RETRIES) store.addError(`Falha na ${label} após 3 tentativas.`);
            await sleep(2000 * attempt);
        }
    }
    return [];
  }
}

export const questionProcessor = new QuestionOrchestrator();
