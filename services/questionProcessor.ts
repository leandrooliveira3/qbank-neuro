import { processFileQuestions } from './ai';
import * as pdfjsLib from 'pdfjs-dist';
import { useImportStore } from '../store/useImportStore';
import mammoth from 'mammoth';

if (typeof window !== 'undefined') {
    // Usar a mesma versão do pdfjs-dist instalado no package.json
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
            console.error("Erro no processador:", err);
            store.addError(`Falha crítica: ${err.message}`); 
            store.finishProcess(); 
        }
    } finally {
        // Garantir reset de flag interna após conclusão ou erro
        if (this.isCancelled) {
            console.debug("Processamento abortado pelo usuário.");
        }
    }
  }

  private async handlePdfWithSlidingWindow(file: File, options: any, store: any) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    store.startProcess(totalPages);

    for (let i = 1; i <= totalPages; i++) {
        if (this.isCancelled) break;

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items.map((item: any) => item.str).join(' ');
        
        let contentPayload = `[PÁGINA ATUAL: ${i}]\n${pageStr}`;
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
            await this.callAiInternal(contentPayload, imagesPayload, `Pág ${i}`, options, store);
            await sleep(1500); 
        }
    }
  }

  private async processLargeTextInSmallChunks(text: string, options: any, store: any) {
    const CHUNK_SIZE = 6000; 
    const OVERLAP = 1500; 
    
    const totalBatches = Math.ceil(text.length / CHUNK_SIZE);
    store.startProcess(totalBatches);

    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
        if (this.isCancelled) break;
        const chunk = text.substring(i, i + CHUNK_SIZE + OVERLAP);
        await this.callAiInternal(chunk, [], `Parte ${(i/CHUNK_SIZE)+1}`, options, store);
        await sleep(1000);
    }
  }

  private async callAiInternal(content: string, images: string[], label: string, options: any, store: any) {
    if (this.isCancelled) return;
    
    let attempt = 0;
    while (attempt < MAX_RETRIES && !this.isCancelled) {
        attempt++;
        try {
            const aiQuestions = await processFileQuestions(
                content, 
                options.customPrompt, 
                undefined, 
                images, 
                options.sourceType === 'study' ? (options.totalQuestionsTarget || 10) : undefined, 
                'extract', 
                options.sourceType
            );

            if (this.isCancelled) return;

            if (aiQuestions?.length > 0) {
                store.addResults(aiQuestions);
                store.incrementProgress(`${label}: +${aiQuestions.length} itens.`);
            } else {
                store.incrementProgress(`${label}: Analisada.`);
            }
            return;
        } catch (e) {
            if (this.isCancelled) return;
            if (attempt === MAX_RETRIES) store.addError(`Falha no lote ${label}`);
            await sleep(2000 * attempt);
        }
    }
  }
}
export const questionProcessor = new QuestionOrchestrator();
