
import * as pdfjsLib from 'pdfjs-dist';

export type VisualElementType = "IMAGEM_CLINICA" | "TABELA" | "GRAFICO" | "ESQUEMA" | "DESCONHECIDO";

export interface VisualElement {
  id: string;
  pageIndex: number;
  base64: string; 
  width: number;
  height: number;
  bbox: number[]; // [x, y, w, h] em pixels
  normalizedBbox: number[]; // [ymin, xmin, ymax, xmax] em escala 0-1000 (Top-Down)
  rawType: "RASTER" | "VECTOR_DENSE";
  classification: VisualElementType;
}

const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

function multiplyMatrix(m1: number[], m2: number[]) {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + b1 * c2,
    a1 * b2 + b1 * d2,
    c1 * a2 + d1 * c2,
    c1 * b2 + d1 * d2,
    e1 * a2 + f1 * c2 + e2,
    e1 * b2 + f1 * d2 + f2,
  ];
}

function applyTransform(p: [number, number], m: number[]): [number, number] {
  const [x, y] = p;
  const [a, b, c, d, e, f] = m;
  return [a * x + c * y + e, b * x + d * y + f];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  type?: 'RASTER' | 'VECTOR';
}

export class PDFVisualExtractor {
  
  private MERGE_TOLERANCE = 60; 

  public async extractAndClassify(file: File): Promise<VisualElement[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const elements: VisualElement[] = [];

    const maxPages = Math.min(pdf.numPages, 50);

    for (let i = 1; i <= maxPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const pageElements = await this.processPage(page, i);
        elements.push(...pageElements);
        page.cleanup(); 
      } catch (e) {
        console.warn(`Erro visual na página ${i}:`, e);
      }
    }

    return elements;
  }

  private async processPage(page: any, pageIndex: number): Promise<VisualElement[]> {
    let ops;
    try {
        ops = await page.getOperatorList();
    } catch (e) {
        return [];
    }

    const viewport = page.getViewport({ scale: 1.0 }); 
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;
    
    let currentMatrix = [...IDENTITY_MATRIX];
    const matrixStack: number[][] = [];
    const rawRects: Rect[] = [];
    
    // Estado para vetores
    let currentPath: {x: number, y: number}[] = [];

    for (let i = 0; i < ops.fnArray.length; i++) {
      try {
          const fn = ops.fnArray[i];
          const args = ops.argsArray[i];

          // Gestão de Estado
          if (fn === pdfjsLib.OPS.save) {
            matrixStack.push([...currentMatrix]);
          } else if (fn === pdfjsLib.OPS.restore) {
            if (matrixStack.length > 0) currentMatrix = matrixStack.pop()!;
          } else if (fn === pdfjsLib.OPS.transform) {
            currentMatrix = multiplyMatrix(args, currentMatrix);
          }
          // Detecção de Imagens Raster (Bitmaps)
          else if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
            const p0 = applyTransform([0, 0], currentMatrix);
            const p1 = applyTransform([1, 0], currentMatrix);
            const p2 = applyTransform([0, 1], currentMatrix);
            const p3 = applyTransform([1, 1], currentMatrix);

            const minX = Math.min(p0[0], p1[0], p2[0], p3[0]);
            const maxX = Math.max(p0[0], p1[0], p2[0], p3[0]);
            const minY = Math.min(p0[1], p1[1], p2[1], p3[1]);
            const maxY = Math.max(p0[1], p1[1], p2[1], p3[1]);

            const w = Math.abs(maxX - minX);
            const h = Math.abs(maxY - minY);

            if (w < 30 || h < 30) continue; // Ignora ícones muito pequenos
            if (w > pageWidth * 0.98 && h > pageHeight * 0.98) continue; // Ignora background full page

            rawRects.push({ x: minX, y: minY, w, h, type: 'RASTER' });
          }
          // Detecção de Vetores (Diagramas/Esquemas)
          else if (fn === pdfjsLib.OPS.constructPath) {
             // args[0] = ops, args[1] = coords
             const pathOps = args[0];
             const pathCoords = args[1];
             let k = 0;
             let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
             let hasPoints = false;

             for (let j = 0; j < pathOps.length; j++) {
                 const op = pathOps[j];
                 if (op === pdfjsLib.OPS.moveTo || op === pdfjsLib.OPS.lineTo) {
                     const p = applyTransform([pathCoords[k], pathCoords[k+1]], currentMatrix);
                     minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
                     maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
                     k += 2;
                     hasPoints = true;
                 } else if (op === pdfjsLib.OPS.curveTo) {
                     // Bezier tem 3 pares de coordenadas
                     for(let c=0; c<3; c++) {
                        const p = applyTransform([pathCoords[k], pathCoords[k+1]], currentMatrix);
                        minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]);
                        maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]);
                        k += 2;
                     }
                     hasPoints = true;
                 } else if (op === pdfjsLib.OPS.rectangle) {
                     const x = pathCoords[k], y = pathCoords[k+1], w = pathCoords[k+2], h = pathCoords[k+3];
                     const p0 = applyTransform([x, y], currentMatrix);
                     const p1 = applyTransform([x+w, y+h], currentMatrix);
                     minX = Math.min(minX, p0[0], p1[0]); minY = Math.min(minY, p0[1], p1[1]);
                     maxX = Math.max(maxX, p0[0], p1[0]); maxY = Math.max(maxY, p0[1], p1[1]);
                     k += 4;
                     hasPoints = true;
                 }
             }

             if (hasPoints) {
                 const w = maxX - minX;
                 const h = maxY - minY;
                 // Filtra linhas muito finas ou pontos isolados (ruído de texto)
                 // Aceita se tiver área ou for uma linha longa
                 if ((w > 50 && h > 50) || (w > 100 && h > 2) || (h > 100 && w > 2)) {
                     rawRects.push({ x: minX, y: minY, w, h, type: 'VECTOR' });
                 }
             }
          }
      } catch (err) {
          continue;
      }
    }

    if (rawRects.length === 0) return [];

    const mergedRects = this.mergeIntersectingRects(rawRects);

    const renderScale = 1.5;
    const renderViewport = page.getViewport({ scale: renderScale });
    const canvas = document.createElement('canvas');
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx) return [];

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;

    const extracted: VisualElement[] = [];

    for (const rect of mergedRects) {
        const rectArray = [rect.x, rect.y, rect.x + rect.w, rect.y + rect.h];
        const originalViewport = page.getViewport({ scale: 1.0 });
        const pixelRect = originalViewport.convertToViewportRectangle(rectArray);
        
        let x1 = Math.min(pixelRect[0], pixelRect[2]);
        let x2 = Math.max(pixelRect[0], pixelRect[2]);
        let y1 = Math.min(pixelRect[1], pixelRect[3]);
        let y2 = Math.max(pixelRect[1], pixelRect[3]);

        x1 *= renderScale;
        x2 *= renderScale;
        y1 *= renderScale;
        y2 *= renderScale;

        const w = x2 - x1;
        const h = y2 - y1;

        if (w < 50 || h < 50) continue;
        
        const normYMin = Math.round((Math.min(pixelRect[1], pixelRect[3]) / originalViewport.height) * 1000);
        const normXMin = Math.round((Math.min(pixelRect[0], pixelRect[2]) / originalViewport.width) * 1000);
        const normYMax = Math.round((Math.max(pixelRect[1], pixelRect[3]) / originalViewport.height) * 1000);
        const normXMax = Math.round((Math.max(pixelRect[0], pixelRect[2]) / originalViewport.width) * 1000);

        try {
            const imgData = ctx.getImageData(x1, y1, w, h);
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = w;
            cropCanvas.height = h;
            const cropCtx = cropCanvas.getContext('2d');
            
            if (cropCtx) {
                cropCtx.putImageData(imgData, 0, 0);
                const base64 = cropCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
                
                extracted.push({
                    id: `FIG_P${pageIndex}_${Math.floor(x1)}`,
                    pageIndex,
                    base64,
                    width: w,
                    height: h,
                    bbox: [x1, y1, w, h],
                    normalizedBbox: [normYMin, normXMin, normYMax, normXMax],
                    rawType: rect.type === 'VECTOR' ? "VECTOR_DENSE" : "RASTER",
                    classification: rect.type === 'VECTOR' ? "ESQUEMA" : "IMAGEM_CLINICA"
                });
            }
        } catch (e) {
            console.warn("Erro crop:", e);
        }
    }
    
    canvas.width = 0; 
    canvas.height = 0;

    return extracted;
  }

  private mergeIntersectingRects(rects: Rect[]): Rect[] {
    if (rects.length === 0) return [];
    
    // Sort by y to optimize
    rects.sort((a, b) => a.y - b.y);

    let currentRects = [...rects];
    let changed = true;

    while (changed) {
        changed = false;
        const newRects: Rect[] = [];
        const used = new Array(currentRects.length).fill(false);

        for (let i = 0; i < currentRects.length; i++) {
            if (used[i]) continue;
            
            let r1 = currentRects[i];
            used[i] = true;

            for (let j = i + 1; j < currentRects.length; j++) {
                if (used[j]) continue;
                const r2 = currentRects[j];
                
                if (this.areClose(r1, r2)) {
                    const minX = Math.min(r1.x, r2.x);
                    const minY = Math.min(r1.y, r2.y);
                    const maxX = Math.max(r1.x + r1.w, r2.x + r2.w);
                    const maxY = Math.max(r1.y + r1.h, r2.y + r2.h);
                    
                    // Se um deles for vetor, o merge é vetor (diagrama complexo)
                    const type = (r1.type === 'VECTOR' || r2.type === 'VECTOR') ? 'VECTOR' : 'RASTER';

                    r1 = { x: minX, y: minY, w: maxX - minX, h: maxY - minY, type };
                    used[j] = true;
                    changed = true;
                }
            }
            newRects.push(r1);
        }
        currentRects = newRects;
    }

    return currentRects;
  }

  private areClose(r1: Rect, r2: Rect): boolean {
      const tol = this.MERGE_TOLERANCE;
      const xOverlap = (r1.x < r2.x + r2.w + tol) && (r1.x + r1.w + tol > r2.x);
      const yOverlap = (r1.y < r2.y + r2.h + tol) && (r1.y + r1.h + tol > r2.y);
      return xOverlap && yOverlap;
  }
}

export const visualExtractor = new PDFVisualExtractor();
