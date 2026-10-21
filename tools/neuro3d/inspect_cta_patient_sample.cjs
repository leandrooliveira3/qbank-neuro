/** Offline check of bounded, locally downloaded public CTA samples.
 * node tools/neuro3d/inspect_cta_patient_sample.cjs SAMPLE_DIR REPORT.json
 * No images, identity fields, UIDs or CSV demographics are published.
 * Actual trusted application reader is transpiled in memory for CommonJS
 * compatibility with dicom-parser. No dataset-supplied code is executed.
 */
const {readFileSync,writeFileSync}=require('node:fs');
const {resolve,dirname}=require('node:path');
const {createHash}=require('node:crypto');
const Module=require('node:module');
const ts=require('typescript');
const {parseDicom}=require('dicom-parser');
const readerPath=resolve(__dirname,'../../features/neuro3d/patient/dicomVolume.ts');
const compiled=ts.transpileModule(readFileSync(readerPath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const readerModule=new Module(readerPath,module);readerModule.filename=readerPath;readerModule.paths=Module._nodeModulePaths(dirname(readerPath));readerModule._compile(compiled,readerPath);
const {parsePatientDicom}=readerModule.exports;
const [sampleDir,reportPath]=process.argv.slice(2);
if(!sampleDir||!reportPath)throw new Error('Provide sample directory and output JSON path.');
const numeric=s=>s?.split('\\').map(Number)??[];
const samples=['Studies_184_0.dcm','Studies_184_1.dcm','Studies_184_559.dcm'].map(name=>{
  const raw=readFileSync(resolve(sampleDir,name)),bytes=new Uint8Array(raw),data=parseDicom(bytes);
  let reader;
  try{reader={accepted:true,frames:parsePatientDicom(bytes).length};}
  catch(error){reader={accepted:false,reason:error instanceof Error?error.message:'Reader rejected sample'};}
  return {file:name,bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),
    modality:data.string('x00080060'),sopClass:data.string('x00080016'),transferSyntax:data.string('x00020010'),
    rows:data.uint16('x00280010'),columns:data.uint16('x00280011'),
    pixelSpacingMm:numeric(data.string('x00280030')),orientationLPS:numeric(data.string('x00200037')),
    positionLPSmm:numeric(data.string('x00200032')),bitsAllocated:data.uint16('x00280100'),
    encapsulatedPixelData:Boolean(data.elements.x7fe00010?.encapsulatedPixelData),reader};
});
const report={schema:1,source:'https://zenodo.org/records/15697196',license:'CC-BY-4.0',
  method:'dicom-parser headers plus actual parsePatientDicom on three original slices; no decoder/conversion',
  samples,fullSeriesValidated:false,annotationRegistered:false,rotationalAngiographyValidated:false,
  limitations:'Three slices only; no volume assembly or STL-to-DICOM transform established. Raw data and identity fields are not included.'};
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({samples:samples.length,accepted:samples.map(s=>s.reader.accepted),report:reportPath}));
