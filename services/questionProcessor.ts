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

    const BATCH_SIZE = 3;
    for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
        if (this.isCancelled) break;

        const batchPromises: Promise<void>[] = [];
        const batchResults: any[][] = [];

        for (let j = 0; j < BATCH_SIZE && i + j <= totalPages; j++) {
            const pageNum = i + j;
            batchResults[j] = [];

            batchPromises.push((async (index) => {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageStr = textContent.items.map((item: any) => item.str).join(' ');

                let instruction = options.sourceType === 'study' ?
                    `[INSTRUÇÃO ABSOLUTA: Se a página contiver apenas bibliografia, capa ou sumário, retorne []. Caso contrário, gere rigorosamente EXATAMENTE ${questionsPerPage ?? 3} questão(ões) de múltipla escolha BASEADAS NESTA PÁGINA.
            REGRAS OBRIGATÓRIAS:
            1. NÃO INVENTE. Só faça perguntas cuja resposta está no texto/imagem fornecidos.
            2. TAG DE IMAGEM: Se a questão exige que o aluno veja a figura para poder responder, VOCÊ DEVE digitar "[ANEXAR_IMAGEM_MANUAL]" no final da string \`comentario\`.]` :
                    `[INSTRUÇÃO ABSOLUTA: EXTRATOR CIRÚRGICO - EXTRAÇÃO COMPLETA
            Sua missão é extrair TODAS e SOMENTE as questões que INICIAM na [PÁGINA ATUAL: ${pageNum}].
            
            DIRETRIZES DE OURO:
            1. RECONHECIMENTO DE PADRÕES: Extraia a questão COM TODAS AS ALTERNATIVAS, não importa o número, não pule questões.
            2. INTEGRIDADE DA QUESTÃO: Se a questão INICIA na PÁGINA ATUAL e terminar na SEGUINTE, junte os textos e retorne COMPLETO.
            3. SEM DUPLICAÇÃO E SEM INVENÇÃO: Não complete com questões que não estão aí, transcreva-as puras e completas.
            4. IMAGEM: OBRIGATORIAMENTE digite "[ANEXAR_IMAGEM_MANUAL]" no FINAL DO TEXTO em \`comentario\` para CADA questão que tiver figura referenciada no enunciado ("veja figura 1").
            5. GABARITO E CONTEXTO: Enunciados com casos clínicos genéricos devem receber o caso em seu corpo. Retorne [] se não houver questão iniciando aqui.
            6. MANTENHA O NÚMERO ORIGINAL DA QUESTÃO NO ENUNCIADO.]`;

                let contentPayload = `${instruction}\n\n[PÁGINA ATUAL: ${pageNum} de ${totalPages}]\n${pageStr}`;
                const imagesPayload: string[] = [];

                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                if (ctx) {
                    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                    imagesPayload.push(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
                }

                if (pageNum < totalPages && !this.isCancelled && options.sourceType === 'exam') {
                    const nextPage = await pdf.getPage(pageNum + 1);
                    const nextTextContent = await nextPage.getTextContent();
                    const nextStr = nextTextContent.items.map((item: any) => item.str).join(' ');
                    contentPayload += `\n\n[PÁGINA SEGUINTE (SOMENTE PARA CONTINUAÇÃO DE TEXTO CORTADO): ${pageNum + 1}]\n${nextStr}`;

                    const nextViewport = nextPage.getViewport({ scale: 1.0 });
                    const nextCanvas = document.createElement('canvas');
                    const nextCtx = nextCanvas.getContext('2d');
                    nextCanvas.height = nextViewport.height;
                    nextCanvas.width = nextViewport.width;
                    if (nextCtx) {
                        await nextPage.render({ canvasContext: nextCtx, viewport: nextViewport, canvas: nextCanvas }).promise;
                        imagesPayload.push(nextCanvas.toDataURL('image/jpeg', 0.4).split(',')[1]);
                    }
                }

                if (!this.isCancelled) {
                    const questions = await this.callAiInternal(contentPayload, imagesPayload, `Pág ${pageNum}`, options, store, questionsPerPage);
                    batchResults[index] = questions;
                }
            })(j));
        }

        await Promise.all(batchPromises);

        if (this.isCancelled) break;

        for (let j = 0; j < batchResults.length; j++) {
            const qs = batchResults[j];
            if (qs && qs.length > 0) {
                store.addResults(qs);
                store.incrementProgress(`Pág ${i + j}: +${qs.length} questão(ões).`);
            } else if (qs) {
                store.incrementProgress(`Pág ${i + j}: Processada.`);
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

    const BATCH_SIZE = 3;
    for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
        if (this.isCancelled) break;

        const batchPromises: Promise<void>[] = [];
        const batchResults: any[][] = [];

        for (let j = 0; j < BATCH_SIZE && i + j < totalChunks; j++) {
            const chunkIndex = i + j;
            batchResults[j] = [];
            batchPromises.push((async (index) => {
                const questions = await this.callAiInternal(chunks[chunkIndex], [], `Parte ${chunkIndex + 1}`, options, store, questionsPerChunk);
                batchResults[index] = questions;
            })(j));
        }

        await Promise.all(batchPromises);

        if (this.isCancelled) break;

        for (let j = 0; j < batchResults.length; j++) {
            const qs = batchResults[j];
            if (qs && qs.length > 0) {
                store.addResults(qs);
                store.incrementProgress(`Parte ${i + j + 1}: +${qs.length} questão(ões).`);
            } else if (qs) {
                store.incrementProgress(`Parte ${i + j + 1}: Processada.`);
            }
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
