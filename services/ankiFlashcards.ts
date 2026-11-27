import { decompress } from 'fzstd';
import { Reader } from 'protobufjs/minimal.js';

export function decodeAnkiBytes(bytes: Uint8Array) {
    const zstd = bytes[0] === 0x28 && bytes[1] === 0xb5 && bytes[2] === 0x2f && bytes[3] === 0xfd;
    return zstd ? decompress(bytes) : bytes;
}

export function readAnkiMediaMap(bytes: Uint8Array, modern: boolean): Map<string, string> {
    if (!modern) {
        const entries = Object.entries(JSON.parse(new TextDecoder().decode(bytes)));
        return new Map(entries.flatMap(([index, name]) => typeof name === 'string' ? [[name, index]] : []));
    }
    // Anki's MediaEntries message stores files in ZIP index order.
    const reader = Reader.create(decodeAnkiBytes(bytes));
    const filenames = new Map<string, string>();
    let index = 0;
    while (reader.pos < reader.len) {
        const tag = reader.uint32();
        if (tag !== 10) {
            reader.skipType(tag & 7);
            continue;
        }
        const entry = Reader.create(reader.bytes());
        let name = '';
        let key = String(index++);
        while (entry.pos < entry.len) {
            const field = entry.uint32();
            if (field === 10) name = entry.string();
            else if (field === (255 << 3)) key = String(entry.uint32());
            else entry.skipType(field & 7);
        }
        if (name) filenames.set(name, key);
    }
    return filenames;
}

export function expandAnkiCloze(text: string) {
    const pattern = /\{\{c(\d+)::(.*?)(?:::(.*?))?\}\}/gs;
    const groups = [...new Set([...text.matchAll(pattern)].map(match => match[1]))];
    const answer = text.replace(pattern, '$2');
    return groups.map(group => ({
        front: text.replace(pattern, (_match, id, value, hint) => id === group ? `[${hint || '...'}]` : value),
        back: answer,
    }));
}

const types: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp',
};
export function ankiImageBlob(bytes: Uint8Array, extension: string): Blob {
    return new Blob([new Uint8Array(decodeAnkiBytes(bytes))], { type: types[extension] || 'application/octet-stream' });
}
