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
            if (content.includes('gemini-2.5-flash-lite')) {
                content = content.replace(/gemini-2.5-flash-lite/g, 'gemini-3.5-flash');
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

replaceInDir('./supabase/functions');
