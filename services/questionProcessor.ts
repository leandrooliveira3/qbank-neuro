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

    // questionsPerPage: fixed number requested per page (study mode), or undefined (exam mode = extract all)
    const questionsPerPage: number | undefined = options.sourceType === 'study'
        ? (options.totalQuestionsTarget || 3)
        : undefined;

    store.startProcess(totalPages);

    for (let i = 1; i <= totalPages; i++) {
        if (this.isCancelled) break;

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items.map((item: any) => item.str).join(' ');

        let instruction = options.sourceType === 'study' ?
            `[INSTRUÇÃO: Se esta página contiver apenas referências bibliográficas, bibliografia, índice ou lista de autores, retorne um array vazio []. Caso contrário, gere EXATAMENTE ${questionsPerPage ?? 3} questão(ões) de múltipla escolha sobre o conteúdo clínico desta página. Não gere mais nem menos do que o número solicitado.]` :
            `[INSTRUÇÃO: ATUE COMO UM EXTRATOR CIRÚRGICO DE PDF EM ALTA PRECISÃO.
            Sua missão é extrair TODAS as questões que COMECEM na [PÁGINA ATUAL: ${i}].
            
            DIRETRIZES DE OURO:
            1. NÃO PULE NENHUMA QUESTÃO. Se a questão "X" começa nesta página, ela DEVE ser extraída agora.
            2. MANTENHA A ORDEM: Extraia na exata sequência em que aparecem.
            3. TRATAMENTO DE QUEBRAS: Se uma questão começar na PÁGINA ATUAL mas for interrompida, use o conteúdo da [PÁGINA SEGUINTE] para completá-la INTEGRALMENTE aqui mesmo.
            4. EVITE DUPLICIDADE: Uma questão deve ser extraída APENAS na fase referente à página onde seu enunciado começa. Não a repita na próxima fase se ela for apenas a continuação.
            5. FIDELIDADE ABSOLUTA: Não resuma enunciados ou alternativas. Mantenha os números das questões (ex: "Questão 1: ...").
            6. IDENTIFICAÇÃO DE FIM DE PROVA: Se a página contiver gabaritos ou lista de bibliografia, ignore-os a menos que contenham questões.
            
            Retorne o resultado em um Array JSON. Se nenhuma questão INICIAR nesta página, retorne [].]`;

        let contentPayload = `${instruction}\n\n[PÁGINA ATUAL: ${i} de ${totalPages}]\n${pageStr}`;
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
                await nextPage.render({ canvasContext: nextCtx, viewport: nextViewport, canvas: nextCanvas }).promise;
                imagesPayload.push(nextCanvas.toDataURL('image/jpeg', 0.4).split(',')[1]);
            }
        }

        if (!this.isCancelled) {
            const added = await this.callAiInternal(contentPayload, imagesPayload, `Pág ${i}`, options, store, questionsPerPage);
            store.incrementProgress(`Pág ${i}: +${added} questão(ões).`);
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
    store.startProcess(totalChunks);

    const questionsPerChunk: number | undefined = options.sourceType === 'study'
        ? (options.totalQuestionsTarget || 3)
        : undefined;

    for (let i = 0; i < totalChunks; i++) {
        if (this.isCancelled) break;

        const added = await this.callAiInternal(chunks[i], [], `Parte ${i + 1}`, options, store, questionsPerChunk);
        store.incrementProgress(`Parte ${i + 1}: +${added} questão(ões).`);
        await sleep(1000);
    }
  }

  // Returns the number of questions actually stored
  private async callAiInternal(
    content: string,
    images: string[],
    label: string,
    options: any,
    store: any,
    questionsPerPage?: number
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
                questionsPerPage,
                'extract',
                options.sourceType
            );

            if (this.isCancelled) return 0;

            if (aiQuestions?.length > 0) {
                // Hard-trim to exactly what was requested so the AI can't over-generate
                const trimmed = questionsPerPage !== undefined
                    ? aiQuestions.slice(0, questionsPerPage)
                    : aiQuestions;
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
