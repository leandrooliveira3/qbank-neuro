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

    const totalTarget = options.sourceType === 'study' ? (options.totalQuestionsTarget || 10) : undefined;

    // When a target exists, track progress in terms of questions generated.
    // When no target, track progress in terms of pages processed.
    store.startProcess(totalTarget ?? totalPages);

    let generatedCount = 0;

    for (let i = 1; i <= totalPages; i++) {
        if (this.isCancelled) break;
        if (totalTarget !== undefined && generatedCount >= totalTarget) break;

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items.map((item: any) => item.str).join(' ');

        const remainingPages = totalPages - (i - 1);
        const remaining = totalTarget !== undefined ? totalTarget - generatedCount : undefined;

        // Questions to ask the AI for this page: spread the remaining quota evenly
        const questionsForPage = remaining !== undefined
            ? Math.max(1, Math.ceil(remaining / remainingPages))
            : undefined;

        let contentPayload = `[INSTRUÇÃO: Se esta página contiver apenas referências bibliográficas, bibliografia, índice ou lista de autores, retorne um array vazio []. Caso contrário, gere EXATAMENTE ${questionsForPage ?? 'o máximo possível de'} questão(ões) de múltipla escolha sobre o conteúdo clínico desta página. Não gere mais do que o número solicitado.]\n\n[PÁGINA ATUAL: ${i} de ${totalPages}]\n${pageStr}`;
        const imagesPayload: string[] = [];

        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            imagesPayload.push(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
        }

        if (i < totalPages && !this.isCancelled) {
            const nextPage = await pdf.getPage(i + 1);
            const nextTextContent = await nextPage.getTextContent();
            const nextStr = nextTextContent.items.map((item: any) => item.str).join(' ');
            contentPayload += `\n\n[PÁGINA SEGUINTE (APENAS PARA CONTEXTO/RECONSTRUÇÃO): ${i + 1}]\n${nextStr}`;

            const nextViewport = nextPage.getViewport({ scale: 1.0 });
            const nextCanvas = document.createElement('canvas');
            const nextCtx = nextCanvas.getContext('2d');
            nextCanvas.height = nextViewport.height;
            nextCanvas.width = nextViewport.width;
            if (nextCtx) {
                await nextPage.render({ canvasContext: nextCtx, viewport: nextViewport }).promise;
                imagesPayload.push(nextCanvas.toDataURL('image/jpeg', 0.4).split(',')[1]);
            }
        }

        if (!this.isCancelled) {
            // hardMax: never let this page exceed what's still needed
            const hardMax = remaining !== undefined ? Math.min(questionsForPage!, remaining) : undefined;
            const added = await this.callAiInternal(contentPayload, imagesPayload, `Pág ${i}`, options, store, questionsForPage, hardMax);
            generatedCount += added;

            // Update progress: when target exists → by questions; otherwise → by pages
            if (totalTarget !== undefined) {
                store.updateProgress(
                    Math.min(generatedCount, totalTarget),
                    `Pág ${i}: +${added} questão(ões). Total: ${generatedCount}/${totalTarget}`
                );
            } else {
                store.incrementProgress(`Pág ${i}: +${added} itens.`);
            }

            await sleep(1500);
        }
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

    const totalTarget = options.sourceType === 'study' ? (options.totalQuestionsTarget || 10) : undefined;
    store.startProcess(totalTarget ?? totalChunks);

    let generatedCount = 0;

    for (let i = 0; i < totalChunks; i++) {
        if (this.isCancelled) break;
        if (totalTarget !== undefined && generatedCount >= totalTarget) break;

        const remainingChunks = totalChunks - i;
        const remaining = totalTarget !== undefined ? totalTarget - generatedCount : undefined;

        const questionsForChunk = remaining !== undefined
            ? Math.max(1, Math.ceil(remaining / remainingChunks))
            : undefined;

        const hardMax = remaining !== undefined ? Math.min(questionsForChunk!, remaining) : undefined;
        const added = await this.callAiInternal(chunks[i], [], `Parte ${i + 1}`, options, store, questionsForChunk, hardMax);
        generatedCount += added;

        if (totalTarget !== undefined) {
            store.updateProgress(
                Math.min(generatedCount, totalTarget),
                `Parte ${i + 1}: +${added} questão(ões). Total: ${generatedCount}/${totalTarget}`
            );
        } else {
            store.incrementProgress(`Parte ${i + 1}: +${added} itens.`);
        }

        await sleep(1000);
    }
  }

  // Returns the number of questions actually stored (after trimming)
  private async callAiInternal(
    content: string,
    images: string[],
    label: string,
    options: any,
    store: any,
    requestCount?: number,
    hardMax?: number
  ): Promise<number> {
    if (this.isCancelled) return 0;

    let attempt = 0;
    while (attempt < MAX_RETRIES && !this.isCancelled) {
        attempt++;
        try {
            const aiQuestions = await processFileQuestions(
                content,
                options.customPrompt,
                undefined,
                images,
                requestCount,
                'extract',
                options.sourceType
            );

            if (this.isCancelled) return 0;

            if (aiQuestions?.length > 0) {
                // Hard-trim: never store more than what's remaining
                const trimmed = hardMax !== undefined ? aiQuestions.slice(0, hardMax) : aiQuestions;
                store.addResults(trimmed);
                return trimmed.length;
            }
            return 0;
        } catch (e) {
            if (this.isCancelled) return 0;
            if (attempt === MAX_RETRIES) store.addError(`Falha no lote ${label}`);
            await sleep(2000 * attempt);
        }
    }
    return 0;
  }
}

export const questionProcessor = new QuestionOrchestrator();
