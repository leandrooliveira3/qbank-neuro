/** Analyze an explicit compiled JS artifact with pinned REA; never execute the target. */
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const [target, destination] = process.argv.slice(2);
if (!target || !destination) throw Error('Usage: node tools/rea/analyze.mjs ABSOLUTE_ARTIFACT_DIRECTORY ABSOLUTE_NEW_REPORT_DIRECTORY');
if (!path.isAbsolute(target) || !path.isAbsolute(destination)) throw Error('Use explicit absolute paths');
if (fs.existsSync(destination)) throw Error('Report directory already exists; choose a new destination');
const root=path.dirname(fileURLToPath(import.meta.url));
const cli=process.env.NEURO_REA_CLI ?? path.join(root,'node_modules/rea-agents/scripts/rea.mjs');
if(!fs.existsSync(cli))throw Error('Install the pinned tooling with npm ci --prefix tools/rea --ignore-scripts');
fs.mkdirSync(destination,{recursive:true});
const evidence=path.join(destination,'evidence.json'),err=path.join(destination,'stderr.log');
const outFd=fs.openSync(evidence,'w'),errFd=fs.openSync(err,'w');
const child=spawn(process.execPath,[cli,'analyze-javascript-application',target,'--format','json'],{stdio:['ignore',outFd,errFd]});
child.on('error',error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
child.on('close',code=>{fs.closeSync(outFd);fs.closeSync(errFd);fs.writeFileSync(path.join(destination,'run.json'),JSON.stringify({tool:'rea-agents',version:'6.5.0',operation:'analyze-javascript-application',target,exitCode:code},null,2)+'\n');process.exitCode=code??1;});
