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
  const { anatomicalInventory, diagramRegistry } = await import(pathToFileURL(file).href);
  const counts = Object.fromEntries(['imported','reconstructed','partial','missing','unresolved'].map(status => [status,anatomicalInventory.filter(row => row.status === status).length]));
  const report = {reviewedAt:diagramRegistry.reviewedAt,sourceUrl:diagramRegistry.sourceUrl,counts,relationCount:diagramRegistry.relations.length,
    geometryReview:'Identity and conceptual network audit; specialist geometric and interactive-browser validation pending.',entries:anatomicalInventory,relations:diagramRegistry.relations};
  await fs.writeFile(path.join(root,'docs/neuro3d-diagram-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({counts,mcaMeshes:anatomicalInventory.find(row => row.number === '118').ids.length}));
} finally { await fs.rm(directory,{recursive:true,force:true}); }
