"""Extract the user-provided catalogue, preserving source dimensions and caveats."""
import argparse,hashlib,json,re
from pathlib import Path
from zipfile import ZipFile
from lxml import etree
from import_open_anatomy import ROOT
NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
def text(node):return ''.join(node.xpath('.//w:t/text()',namespaces=NS))
def main():
 p=argparse.ArgumentParser();p.add_argument('docx',type=Path);a=p.parse_args()
 with ZipFile(a.docx) as z:root=etree.fromstring(z.read('word/document.xml'))
 section='';sectionNo=0;records=[];kits=[];kit=None;notes=[];sources=[]
 for node in root.find('w:body',NS):
  if node.tag.endswith('}p'):
   value=text(node);style=node.find('w:pPr/w:pStyle',NS);style=style.get('{'+NS['w']+'}val') if style is not None else ''
   if style=='Heading1':
    section=value;sectionNo=int(re.match(r'\d+',value)[0]);kit=None
   elif style=='Heading2' and sectionNo==8:kit={'id':'kit-'+str(len(kits)+1),'name':value,'composition':''};kits.append(kit)
   elif kit is not None and sectionNo==8 and value:kit['composition']+=value
   elif sectionNo==9 and value:notes.append(value)
   elif sectionNo==10 and value:sources.append(value)
  elif node.tag.endswith('}tbl'):
   for index,row in enumerate(node.findall('w:tr',NS)[1:],1):
    cells=[text(cell) for cell in row.findall('w:tc',NS)];assert len(cells)==4
    records.append({'id':f's{sectionNo}r{index}','section':section,'category':cells[0],'products':[v.strip() for v in cells[1].split(';') if v.strip()],'dimensions':cells[2],'notes':cells[3],'specificationStatus':'user-catalogue-representative-not-independently-IFU-verified'})
 assert len(records)==41 and len(kits)==14 and all(k['composition'] for k in kits)
 result={'version':1,'sourceName':a.docx.name,'sourceSha256':hashlib.sha256(a.docx.read_bytes()).hexdigest(),'scope':'User-provided inventory; representative ranges, not a full SKU or compatibility database','records':records,'kits':kits,'notes':notes,'sources':sources}
 (ROOT/'features/neuro3d/simulation/station/device-catalogue.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(len(records),'classes;',sum(len(r['products']) for r in records),'product/family entries;',len(kits),'kits')
if __name__=='__main__':main()
