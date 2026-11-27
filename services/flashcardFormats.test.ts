import { describe, expect, it } from 'vitest';
import { Writer } from 'protobufjs/minimal.js';
import { decodeAnkiBytes, expandAnkiCloze, readAnkiMediaMap } from './ankiFlashcards';
import { parseFlashcardCsv, parseFlashcardJson } from './flashcardImport';
import { flashcardImages, replaceFlashcardBackImage } from './flashcardMedia';
import type { Flashcard } from '../types';

describe('formatos de flashcards', () => {
    it('importa CSV com separador dentro de aspas, aspas escapadas e várias linhas', () => {
        const csv = '\uFEFFFrente;Verso\r\n"Um; dois";"Linha 1\r\nLinha ""2"""\r\n';
        expect(parseFlashcardCsv(csv)).toEqual([{ front: 'Um; dois', back: 'Linha 1\r\nLinha "2"' }]);
        expect(parseFlashcardCsv('"A, B","C"')).toEqual([{ front: 'A, B', back: 'C' }]);
    });

    it('reimporta mídia e oclusões de um backup com a posição legada', () => {
        const occlusions = [{ id: 'occlusion-1', x: 10, y: 20, width: 30, height: 15 }];
        const text = JSON.stringify({ cards: [null, { front: 123, back: 'sem frente' }, {
            front: '', back: 'Resposta', front_image_url: '/media/card.png', image_position: 'both', occlusions,
        }] });
        expect(parseFlashcardJson(text)).toEqual([{
            front: '', back: 'Resposta', frontImageUrl: '/media/card.png', backImageUrl: undefined,
            imageSide: 'both', occlusions, tags: [],
        }]);
    });

    it('lê o manifesto JSON legado e o MediaEntries moderno de acordo com seus índices', () => {
        expect([...readAnkiMediaMap(new TextEncoder().encode('{"7":"uma.png"}'), false)]).toEqual([['uma.png', '7']]);
        const entries = Writer.create();
        entries.uint32(10).fork().uint32(10).string('uma.png').ldelim()
            .uint32(10).fork().uint32(10).string('outra.png').ldelim();
        expect([...readAnkiMediaMap(entries.finish(), true)]).toEqual([['uma.png', '0'], ['outra.png', '1']]);
        expect(decodeAnkiBytes(new Uint8Array([1, 2]))).toEqual(new Uint8Array([1, 2]));
    });

    it('separa os grupos de cloze, ocultando apenas o grupo de cada cartão', () => {
        expect(expandAnkiCloze('{{c1::alfa::letra}} e {{c2::beta}}')).toEqual([
            { front: '[letra] e beta', back: 'alfa e beta' },
            { front: 'alfa e [...]', back: 'alfa e beta' },
        ]);
    });

    it('remove a imagem compartilhada do verso sem removê-la da frente nem mexer no agendamento', () => {
        const card = { front_image_url: '/shared.png', image_side: 'both', next_review: '2026-12-07' } as Flashcard;
        expect(flashcardImages(card)).toEqual({ front: '/shared.png', back: '/shared.png' });
        const edited = replaceFlashcardBackImage(card, '');
        expect(flashcardImages(edited)).toEqual({ front: '/shared.png', back: '' });
        expect(edited.next_review).toBe(card.next_review);
    });
});
