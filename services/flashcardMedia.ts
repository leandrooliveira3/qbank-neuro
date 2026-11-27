import type { Flashcard } from '../types';

export function flashcardImages(card: Flashcard | undefined) {
    const side = card?.image_side || card?.image_position;
    const front = side === 'back' ? '' : card?.front_image_url || '';
    const back = card?.back_image_url || (side !== 'front' ? card?.front_image_url : '') || '';
    return { front, back };
}

export function replaceFlashcardBackImage(card: Flashcard, back: string): Flashcard {
    const side = card.image_side || card.image_position;
    // Some manual cards store a single source for both sides.
    const frontSource = side === 'back' ? '' : card.front_image_url;
    return {
        ...card, front_image_url: frontSource, back_image_url: back,
        image_side: frontSource ? 'front' : 'back',
        occlusions: frontSource ? card.occlusions : [],
    };
}
