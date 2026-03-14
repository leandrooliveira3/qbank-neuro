import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, Color } from 'pdf-lib';
import download from 'downloadjs';
import { LMEData } from '../types';

// --- ARQUITETURA DE LAYOUT (Coordenadas em % da Página) ---
// Origem (0,0) é o canto inferior esquerdo no PDF, mas aqui abstraímos.
// O motor converte Top-Down % para Bottom-Up Points.

interface FieldRect {
  x: number;
  y: number; // % do topo
  w: number;
  h: number;
}

interface FieldConfig {
  type: 'text' | 'checkbox';
  rect: FieldRect;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  multiline?: boolean;
}

const LAYOUT_CONFIG = {
  PAGES: {
    SPECIFIC: 2, // Página 3
    LME: 3,      // Página 4
    REQUEST: 4   // Página 5
  },
  
  FIELDS: {
    // --- FORMULÁRIO ESPECÍFICO (Pág 3) ---
    SPECIFIC_NOME: { type: 'text', rect: { x: 28, y: 7, w: 65, h: 2.5 }, fontSize: 10 },
    SPECIFIC_HISTORIA: { type: 'text', rect: { x: 8, y: 14, w: 84, h: 18 }, multiline: true, fontSize: 10 }, 
    SPECIFIC_TRAT_PREVIO: { type: 'text', rect: { x: 8, y: 45, w: 84, h: 8 }, multiline: true, fontSize: 10 },
    SPECIFIC_TRAT_ATUAL: { type: 'text', rect: { x: 8, y: 58, w: 84, h: 8 }, multiline: true, fontSize: 10 },
    SPECIFIC_DATA: { type: 'text', rect: { x: 25, y: 88, w: 15, h: 2 }, align: 'center', fontSize: 10 },
    SPECIFIC_MEDICO: { type: 'text', rect: { x: 50, y: 88, w: 40, h: 2 }, align: 'left', fontSize: 10 },

    // --- LME PADRÃO (Pág 4) ---
    // Cabeçalho
    LME_NOME: { type: 'text', rect: { x: 22, y: 13.5, w: 55, h: 2.2 }, fontSize: 10 },
    LME_MAE: { type: 'text', rect: { x: 22, y: 16, w: 55, h: 2.2 }, fontSize: 10 },
    LME_PESO: { type: 'text', rect: { x: 82, y: 13.5, w: 10, h: 2.2 }, fontSize: 10 },
    LME_ALTURA: { type: 'text', rect: { x: 82, y: 16, w: 10, h: 2.2 }, fontSize: 10 },
    
    // Tabela de Medicamentos (Linha 1)
    LME_MED_NOME: { type: 'text', rect: { x: 5, y: 22.5, w: 55, h: 2.5 }, fontSize: 9 },
    LME_QTD_M1: { type: 'text', rect: { x: 63, y: 22.5, w: 5, h: 2.5 }, align: 'center', fontSize: 10 },
    LME_QTD_M2: { type: 'text', rect: { x: 69, y: 22.5, w: 5, h: 2.5 }, align: 'center', fontSize: 10 },
    LME_QTD_M3: { type: 'text', rect: { x: 75, y: 22.5, w: 5, h: 2.5 }, align: 'center', fontSize: 10 },
    LME_QTD_M4: { type: 'text', rect: { x: 81, y: 22.5, w: 5, h: 2.5 }, align: 'center', fontSize: 10 },
    LME_QTD_M5: { type: 'text', rect: { x: 87, y: 22.5, w: 5, h: 2.5 }, align: 'center', fontSize: 10 },
    LME_QTD_M6: { type: 'text', rect: { x: 93, y: 22.5, w: 5, h: 2.5 }, align: 'center', fontSize: 10 },

    // Diagnóstico
    LME_CID: { type: 'text', rect: { x: 10, y: 36.5, w: 15, h: 2.5 }, fontSize: 12 },
    LME_ANAMNESE: { type: 'text', rect: { x: 5, y: 40, w: 90, h: 7 }, multiline: true, fontSize: 10 },
    
    // Checkbox Responsável
    LME_CHECK_RESPONSAVEL: { type: 'checkbox', rect: { x: 12.5, y: 55.2, w: 2.5, h: 1.8 } }, 
    LME_NOME_RESPONSAVEL: { type: 'text', rect: { x: 30, y: 55.5, w: 50, h: 2 }, fontSize: 10 },

    // Rodapé Médico (Aumentado largura do nome)
    LME_MEDICO: { type: 'text', rect: { x: 23, y: 58.2, w: 60, h: 2.2 }, fontSize: 10 },
    LME_CNS: { type: 'text', rect: { x: 23, y: 60.8, w: 35, h: 2.2 }, fontSize: 10 },
    LME_DATA: { type: 'text', rect: { x: 70, y: 60.8, w: 20, h: 2.2 }, fontSize: 10 },

    // --- REQUERIMENTO (Pág 5) ---
    REQ_NOME_1: { type: 'text', rect: { x: 25, y: 17, w: 65, h: 2.2 }, fontSize: 10 },
    REQ_NOME_2: { type: 'text', rect: { x: 25, y: 20, w: 65, h: 2.2 }, fontSize: 10 },
    REQ_MEDICAMENTO: { type: 'text', rect: { x: 10, y: 26, w: 80, h: 3 }, fontSize: 10 },
    
    REQ_DATA_DIA: { type: 'text', rect: { x: 28, y: 31, w: 5, h: 2.2 }, align: 'center', fontSize: 10 },
    REQ_DATA_MES: { type: 'text', rect: { x: 35, y: 31, w: 5, h: 2.2 }, align: 'center', fontSize: 10 },
    REQ_DATA_ANO: { type: 'text', rect: { x: 42, y: 31, w: 8, h: 2.2 }, align: 'center', fontSize: 10 },
    
    REQ_TERMO_NOME: { type: 'text', rect: { x: 15, y: 62, w: 65, h: 2.2 }, fontSize: 10 },
  }
};

// --- FORM ENGINE ---

class PDFFormEngine {
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
  }

  // Converte % (Top-Down) para Pontos Absolutos (Bottom-Up)
  private getBox(page: PDFPage, rect: FieldRect) {
    const { width, height } = page.getSize();
    const absX = (rect.x / 100) * width;
    const absH = (rect.h / 100) * height;
    const absY = height - ((rect.y / 100) * height) - absH;
    const absW = (rect.w / 100) * width;
    return { x: absX, y: absY, width: absW, height: absH };
  }

  public renderField(
    pdfDoc: PDFDocument, 
    page: PDFPage, 
    value: string | boolean, 
    configId: keyof typeof LAYOUT_CONFIG.FIELDS
  ) {
    const config = LAYOUT_CONFIG.FIELDS[configId] as FieldConfig;
    const box = this.getBox(page, config.rect);
    const form = pdfDoc.getForm();

    if (this.debugMode) {
      try {
        page.drawRectangle({
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          borderColor: rgb(1, 0, 0),
          borderWidth: 1,
        });
      } catch (e) { console.warn("Debug draw failed", e); }
    }
    
    try {
        if (config.type === 'checkbox') {
            // Cria Checkbox Interativo
            // Gera um nome único para evitar conflito se a mesma config for usada 2x (improvável aqui, mas boa prática)
            const uniqueName = `${configId}_${Math.random().toString(36).substr(2, 5)}`;
            const checkBox = form.createCheckBox(uniqueName);
            checkBox.addToPage(page, { x: box.x, y: box.y, width: box.width, height: box.height });
            if (value === true) checkBox.check();
        } 
        else {
            // Cria Campo de Texto Editável
            const uniqueName = `${configId}_${Math.random().toString(36).substr(2, 5)}`;
            const textField = form.createTextField(uniqueName);
            const textValue = typeof value === 'string' ? value : '';
            
            textField.setText(textValue);
            textField.addToPage(page, { x: box.x, y: box.y, width: box.width, height: box.height });
            
            if (config.fontSize) textField.setFontSize(config.fontSize);
            if (config.align === 'center') textField.setAlignment(1); // Center
            if (config.align === 'right') textField.setAlignment(2); // Right
            if (config.multiline) textField.enableMultiline();
        }
    } catch (e) {
        console.warn(`Erro ao criar campo ${configId}:`, e);
    }
  }
}

export const generateLmePdf = async (pdfUrl: string, data: LMEData, debugMode: boolean = false) => {
  try {
    const existingPdfBytes = await fetch(pdfUrl).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const engine = new PDFFormEngine(debugMode);

    // Data Parsing
    const dateParts = data.date.split('/'); // DD/MM/AAAA
    const day = dateParts[0] || '';
    const month = dateParts[1] || '';
    const year = dateParts[2] || '';

    // 1. ESPECÍFICO
    if (pages.length > LAYOUT_CONFIG.PAGES.SPECIFIC) {
        const page = pages[LAYOUT_CONFIG.PAGES.SPECIFIC];
        engine.renderField(pdfDoc, page, data.patientName, 'SPECIFIC_NOME');
        engine.renderField(pdfDoc, page, data.clinicalHistory || '', 'SPECIFIC_HISTORIA');
        engine.renderField(pdfDoc, page, data.previousTreatments || '', 'SPECIFIC_TRAT_PREVIO');
        engine.renderField(pdfDoc, page, data.currentTreatment || '', 'SPECIFIC_TRAT_ATUAL');
        engine.renderField(pdfDoc, page, data.date, 'SPECIFIC_DATA');
        engine.renderField(pdfDoc, page, data.professionalName, 'SPECIFIC_MEDICO');
    }

    // 2. LME PADRÃO
    if (pages.length > LAYOUT_CONFIG.PAGES.LME) {
        const page = pages[LAYOUT_CONFIG.PAGES.LME];
        engine.renderField(pdfDoc, page, data.patientName, 'LME_NOME');
        engine.renderField(pdfDoc, page, data.patientMotherName, 'LME_MAE');
        engine.renderField(pdfDoc, page, data.patientWeight || '', 'LME_PESO');
        engine.renderField(pdfDoc, page, data.patientHeight || '', 'LME_ALTURA');
        
        engine.renderField(pdfDoc, page, data.medicationName, 'LME_MED_NOME');
        engine.renderField(pdfDoc, page, data.quantities[0], 'LME_QTD_M1');
        engine.renderField(pdfDoc, page, data.quantities[1], 'LME_QTD_M2');
        engine.renderField(pdfDoc, page, data.quantities[2], 'LME_QTD_M3');
        engine.renderField(pdfDoc, page, data.quantities[3], 'LME_QTD_M4');
        engine.renderField(pdfDoc, page, data.quantities[4], 'LME_QTD_M5');
        engine.renderField(pdfDoc, page, data.quantities[5], 'LME_QTD_M6');

        engine.renderField(pdfDoc, page, data.cid10 || '', 'LME_CID');
        engine.renderField(pdfDoc, page, data.anamnesis || '', 'LME_ANAMNESE');

        // Checkbox real
        engine.renderField(pdfDoc, page, data.hasCapacityAttestation, 'LME_CHECK_RESPONSAVEL');
        if (data.hasCapacityAttestation) {
            engine.renderField(pdfDoc, page, data.responsibleName || '', 'LME_NOME_RESPONSAVEL');
        }

        engine.renderField(pdfDoc, page, data.professionalName, 'LME_MEDICO');
        engine.renderField(pdfDoc, page, data.professionalCNS, 'LME_CNS');
        engine.renderField(pdfDoc, page, data.date, 'LME_DATA');
    }

    // 3. REQUERIMENTO
    if (pages.length > LAYOUT_CONFIG.PAGES.REQUEST) {
        const page = pages[LAYOUT_CONFIG.PAGES.REQUEST];
        engine.renderField(pdfDoc, page, data.patientName, 'REQ_NOME_1');
        engine.renderField(pdfDoc, page, data.patientName, 'REQ_NOME_2');
        engine.renderField(pdfDoc, page, data.medicationName, 'REQ_MEDICAMENTO');
        
        engine.renderField(pdfDoc, page, day, 'REQ_DATA_DIA');
        engine.renderField(pdfDoc, page, month, 'REQ_DATA_MES');
        engine.renderField(pdfDoc, page, year, 'REQ_DATA_ANO');

        engine.renderField(pdfDoc, page, data.patientName, 'REQ_TERMO_NOME');
    }

    // Salvar e Baixar
    const pdfBytes = await pdfDoc.save();
    const fileName = `LME_${data.patientName.replace(/\s/g, '_')}_Editable.pdf`;
    download(pdfBytes, fileName, "application/pdf");

  } catch (e) {
    console.error("Erro PDF Generator:", e);
    alert("Falha na geração do PDF Editável. Verifique o console.");
  }
};