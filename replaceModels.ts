import fs from 'fs';
import path from 'path';

function replaceInDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('gemini-3-flash-preview')) {
                content = content.replace(/gemini-3-flash-preview/g, 'gemini-2.5-flash-lite');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInDir('./supabase/functions');
