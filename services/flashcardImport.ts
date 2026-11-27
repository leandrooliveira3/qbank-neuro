import type { Flashcard } from '../types';

export interface ParsedFlashcard {
    front: string;
    back: string;
    tags?: string[];
    frontImageBlob?: Blob;
    frontImageExt?: string;
    frontImageUrl?: string;
    backImageBlob?: Blob;
    backImageExt?: string;
    backImageUrl?: string;
    imageSide?: Flashcard['image_side'];
    occlusions?: Flashcard['occlusions'];
}

export function parseFlashcardJson(text: string): ParsedFlashcard[] {
    const data = JSON.parse(text.replace(/^\uFEFF/, ''));
    const items = Array.isArray(data) ? data : data?.cards ?? data?.notes;
    if (!Array.isArray(items)) throw new Error('O JSON deve conter uma lista de flashcards.');
    const textValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';
    const imageUrl = (value: unknown) => {
        const url = textValue(value);
        return /^(?:https?:\/\/|\/(?!\/)|data:image\/(?:png|jpeg|gif|webp|avif);base64,)/i.test(url) ? url : undefined;
    };
    return items.flatMap(item => {
        if (!item || typeof item !== 'object') return [];
        const front = textValue(item.front || item.question);
        const back = textValue(item.back || item.answer);
        const frontImageUrl = imageUrl(item.front_image_url);
        const backImageUrl = imageUrl(item.back_image_url);
        if (!(front && back) && !frontImageUrl && !backImageUrl) return [];
        const side = item.image_side ?? item.image_position;
        const imageSide = side === 'front' || side === 'back' || side === 'both' ? side : undefined;
        const tags = Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [];
        const occlusions = Array.isArray(item.occlusions) ? item.occlusions.filter(occ =>
            occ && typeof occ.id === 'string' && ['x', 'y', 'width', 'height'].every(key =>
                Number.isFinite(occ[key]) && occ[key] >= 0 && occ[key] <= 100),
        ) : [];
        return [{ front, back, frontImageUrl, backImageUrl, imageSide, occlusions, tags }];
    });
}

export function parseFlashcardCsv(text: string): ParsedFlashcard[] {
    const csv = text.replace(/^\uFEFF/, '');
    const firstLine = csv.split(/\r?\n/, 1)[0];
    const separators = firstLine.replace(/"(?:[^"]|"")*"/g, '');
    const delimiter = separators.includes(';') && !separators.includes(',') ? ';' : ',';
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    for (let index = 0; index < csv.length; index++) {
        const char = csv[index];
        if (char === '"' && quoted && csv[index + 1] === '"') {
            field += '"';
            index++;
        } else if (char === '"' && (quoted || field === '')) {
            quoted = !quoted;
        } else if (!quoted && (char === delimiter || char === '\r' || char === '\n')) {
            row.push(field.trim());
            field = '';
            if (char !== delimiter) {
                if (char === '\r' && csv[index + 1] === '\n') index++;
                if (row.some(Boolean)) rows.push(row);
                row = [];
            }
        } else {
            field += char;
        }
    }
    if (quoted) throw new Error('O CSV tem um campo entre aspas que não foi fechado.');
    rows.push([...row, field.trim()]);
    if (/^(front|frente|question|pergunta)$/i.test(rows[0]?.[0] ?? '') &&
        /^(back|verso|answer|resposta)$/i.test(rows[0]?.[1] ?? '')) rows.shift();
    return rows.filter(([front, back]) => front && back).map(([front, back]) => ({ front, back }));
}
