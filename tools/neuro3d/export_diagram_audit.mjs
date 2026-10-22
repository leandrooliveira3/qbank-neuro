/** Export the UI's computed registry without starting a dev server or watcher. */
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'neuro3d-audit-'));
try {
  const file = path.join(directory, 'inventory.mjs');
  await build({entryPoints:[path.join(root,'features/neuro3d/anatomicalInventory.ts')],bundle:true,platform:'node',format:'esm',outfile:file,define:{'import.meta.env.BASE_URL':'"/"'},logLevel:'silent'});
  const { anatomicalInventory, diagramRegistry, inventoryStatus } = await import(pathToFileURL(file).href);
  const counts = Object.fromEntries(['imported','reconstructed','partial','missing','unresolved'].map(status => [status,anatomicalInventory.filter(row => row.status === status).length]));
  const report = {reviewedAt:diagramRegistry.reviewedAt,sourceUrl:diagramRegistry.sourceUrl,counts,relationCount:diagramRegistry.relations.length,
    geometryReview:'Identity and conceptual network audit; specialist geometric validation pending. Browser verification scope and results are recorded separately in the review document.',entries:anatomicalInventory,relations:diagramRegistry.relations};
  await fs.writeFile(path.join(root,'docs/neuro3d-diagram-audit.json'),JSON.stringify(report,null,2)+'\n');
  const reviewPath = path.join(root, 'docs/neuro3d-diagram-review.md');
  const previous = await fs.readFile(reviewPath, 'utf8');
  const clean = value => String(value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
  const coverage = '| Estado | Entradas |\n|---|---:|\n' + Object.entries(counts).map(([status, count]) => `| ${inventoryStatus[status]} | ${count} |`).join('\n');
  const prefix = previous.split('## Lista integral')[0].replace(/\| Estado \| Entradas \|[\s\S]*?(?=\n\n)/, coverage);
  const table = '| Número | Estrutura | Estado | IDs identificados |\n|---|---|---|---|\n' + anatomicalInventory.map(row => `| ${clean(row.number)} | ${clean(row.portuguese)} | ${inventoryStatus[row.status]} | ${row.ids.join(', ') || '—'} |`).join('\n');
  const pending = anatomicalInventory.filter(row => ['missing', 'partial', 'unresolved'].includes(row.status)).map(row => `- **${clean(row.number)} — ${clean(row.portuguese)}**: ${clean(row.note)}`).join('\n');
  await fs.writeFile(reviewPath, prefix + '## Lista integral\n\n' + table + '\n\n## Pendências e divergências, por extenso\n\n' + pending + '\n');
  console.log(JSON.stringify({counts,mcaMeshes:anatomicalInventory.find(row => row.number === '118').ids.length}));
} finally { await fs.rm(directory,{recursive:true,force:true}); }
