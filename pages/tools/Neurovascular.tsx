
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, Syringe, Info, CheckCircle2, Ban, 
  AlertTriangle, Timer, Activity, Check, X, Copy,
  ChevronRight, FileBarChart,
  Heart, Droplets, AlertOctagon, Scan, Shield,
  Stethoscope, Siren, Anchor,
  Clock, Maximize2
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { syncEngine } from '../../services/syncEngine';
import { SmartImage } from '../../components/SmartImage';

// --- INTERFACES & TYPES ---
interface InteractiveRegion { id: string; name: string; value: number; points: string; side: 'L' | 'R' | 'C'; }
interface InteractiveSlice { id: string; imageId: string; title: string; regions: InteractiveRegion[]; }
interface CalcTool { 
    id: string; 
    name: string; 
    description: string; 
    icon: any; 
    color?: string;
    bg?: string;
    questions: any[]; 
    interpretation: (score: number) => { text: string; color: string; bg: string; }; 
}

// --- CONSTANTS ---
const CLINICAL_IMAGES = {
  COOKIE_THEFT: "https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/nihss/nihss1.jpg", 
  NAMING_CARD: "https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/nihss/nihss2.jpg",
  NIHSS_SENTENCES: "https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/nihss/afasia.jpg",
  NIHSS_WORDS: "https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/nihss/disartria.jpg",
  ASPECTS_G: "https://radathand.com/wp-content/uploads/2023/06/ASPECTS-RadAide-4-e1688154886452.png", 
  ASPECTS_S: "https://radathand.com/wp-content/uploads/2023/06/ASPECTS-RadAide-3-e1688154856528.png",
  PC_RAD_1: "https://radathand.com/wp-content/uploads/2023/06/ASPECTS-RadAide-1-e1688154921299.png", 
  PC_RAD_2: "https://radathand.com/wp-content/uploads/2023/06/ASPECTS-RadAide-2-e1688154904117.png",
};

const THROMBOLYSIS_TOOL = {
    id: 'thrombolysis',
    name: 'Protocolo de AVC (2026 Guideline)',
    questions: [
      { id: '1a', text: '1a. Nível de Consciência', options: [{value:0, label:'Alerta'}, {value:1, label:'Sonolento'}, {value:2, label:'Torporoso'}, {value:3, label:'Comatoso'}] },
      { id: '1b', text: '1b. Perguntas (Mês/Idade)', options: [{value:0, label:'Ambas corretas'}, {value:1, label:'Uma correta'}, {value:2, label:'Incorretas'}] },
      { id: '1c', text: '1c. Comandos (Olhos/Mão)', options: [{value:0, label:'Ambos corretos'}, {value:1, label:'Um correto'}, {value:2, label:'Incorretas'}] },
      { id: '2', text: '2. Olhar Conjugado', options: [{value:0, label:'Normal'}, {value:1, label:'Paresia parcial'}, {value:2, label:'Desvio forçado'}] },
      { id: '3', text: '3. Campos Visuais', options: [{value:0, label:'Normal'}, {value:1, label:'Quadrantanopsia'}, {value:2, label:'Hemianopsia completa'}, {value:3, label:'Cegueira'}] },
      { id: '4', text: '4. Paralisia Facial', options: [{value:0, label:'Normal'}, {value:1, label:'Leve'}, {value:2, label:'Parcial'}, {value:3, label:'Completa'}] },
      { id: '5a', text: '5a. Braço Esquerdo (10s)', options: [{value:0, label:'Sem queda'}, {value:1, label:'Queda leve'}, {value:2, label:'Toca o leito'}, {value:3, label:'Sem esforço'}, {value:4, label:'Plegia'}] },
      { id: '5b', text: '5b. Braço Direito (10s)', options: [{value:0, label:'Sem queda'}, {value:1, label:'Queda leve'}, {value:2, label:'Toca o leito'}, {value:3, label:'Sem esforço'}, {value:4, label:'Plegia'}] },
      { id: '6a', text: '6a. Perna Esquerda (5s)', options: [{value:0, label:'Sem queda'}, {value:1, label:'Queda leve'}, {value:2, label:'Toca o leito'}, {value:3, label:'Sem esforço'}, {value:4, label:'Plegia'}] },
      { id: '6b', text: '6b. Perna Direito (5s)', options: [{value:0, label:'Sem queda'}, {value:1, label:'Queda leve'}, {value:2, label:'Toca o leito'}, {value:3, label:'Sem esforço'}, {value:4, label:'Plegia'}] },
      { id: '7', text: '7. Ataxia de Membros', options: [{value:0, label:'Ausente'}, {value:1, label:'1 membro'}, {value:2, label:'2+ membros'}] },
      { id: '8', text: '8. Sensibilidade', options: [{value:0, label:'Normal'}, {value:1, label:'Perda leve'}, {value:2, label:'Anestesia'}] },
      { id: '9', text: '9. Linguagem (Afasia)', images: [CLINICAL_IMAGES.COOKIE_THEFT, CLINICAL_IMAGES.NAMING_CARD, CLINICAL_IMAGES.NIHSS_SENTENCES], options: [{value:0, label:'Normal'}, {value:1, label:'Afasia Leve'}, {value:2, label:'Afasia Grave'}, {value:3, label:'Global/Mutismo'}] },
      { id: '10', text: '10. Disartria', images: [CLINICAL_IMAGES.NIHSS_WORDS], options: [{value:0, label:'Normal'}, {value:1, label:'Leve/Moderada'}, {value:2, label:'Anartria/Grave'}] },
      { id: '11', text: '11. Extinção/Inatenção', options: [{value:0, label:'Normal'}, {value:1, label:'Parcial'}, {value:2, label:'Total'}] }
    ],
    subModules: [
        {
            id: 'aspects',
            name: 'ASPECTS (Anterior)',
            initialScore: 10,
            slices: [
                {
                    id: 'ganglionic',
                    imageId: CLINICAL_IMAGES.ASPECTS_G, 
                    title: "Nível Ganglionar",
                    regions: [
                        { id: 'c', name: 'Caudado', value: 1, side: 'R' as const, points: "233,204 244,195 250,185 258,177 253,169 244,173 235,175 230,179 229,187 230,198" },
                        { id: 'l', name: 'Lentiforme', value: 1, side: 'R' as const, points: "269,193 262,202 255,212 253,222 257,228 264,242 269,253 279,259 289,262 291,254 288,238 283,220 277,202" },
                        { id: 'ic', name: 'Cápsula Interna', value: 1, side: 'R' as const, points: "263,182 245,200 234,212 235,225 238,234 243,246 250,257 258,266 263,271 270,265 262,247 256,233 248,217 252,204 266,192" },
                        { id: 'i', name: 'Ínsula', value: 1, side: 'R' as const, points: "284,175 292,193 294,214 297,237 298,259 309,250 311,237 309,223 309,210 309,193 305,177 294,171" },
                        { id: 'm1', name: 'M1 (Anterior)', value: 1, side: 'R' as const, points: "304,112 298,123 301,135 304,146 308,157 311,168 315,176 323,179 333,179 343,178 347,173 342,158 340,147 334,136 331,128 325,119 321,112 314,107" },
                        { id: 'm2', name: 'M2 (Lateral)', value: 1, side: 'R' as const, points: "358,323 341,319 326,313 316,309 309,297 309,284 309,273 316,260 321,248 321,238 329,232 320,222 319,212 319,199 322,187 329,183 343,182 346,188 350,205 354,217 355,230 357,240 358,252 358,269 362,285 361,296 362,308 359,315 358,320" },
                        { id: 'm3', name: 'M3 (Posterior)', value: 1, side: 'R' as const, points: "297,365 305,377 311,391 321,384 331,375 341,363 346,352 353,338 355,327 339,323 328,319 324,329 321,338 314,343 303,353" }
                    ]
                },
                {
                    id: 'supraganglionic',
                    imageId: CLINICAL_IMAGES.ASPECTS_S, 
                    title: "Nível Supraganglionar",
                    regions: [
                        { id: 'm4', name: 'M4 (Anterior Sup)', value: 1, side: 'R' as const, points: "351,179 342,185 333,189 318,195 310,191 297,186 294,178 299,166 300,159 295,150 291,139 297,132 305,121 312,117 321,126 316,135 313,139 318,140 324,138 331,138 335,146 340,151 329,159 323,162 330,163 345,161 347,168" },
                        { id: 'm5', name: 'M5 (Lateral Sup)', value: 1, side: 'R' as const, points: "326,195 351,184 353,191 354,202 354,209 355,220 356,230 357,240 358,252 358,265 358,276 358,286 358,295 356,302 344,302 327,302 314,303 302,294 292,290 286,283 285,274 284,263 284,248 286,239 301,239 308,241 320,241 333,242 328,228 325,213 318,205" },
                        { id: 'm6', name: 'M6 (Posterior Sup)', value: 1, side: 'R' as const, points: "301,353 311,357 322,363 328,366 335,361 341,354 346,345 350,335 354,326 357,317 357,307 339,305 327,306 315,309 306,313 303,321 306,330 314,331 321,334 320,343 313,344" }
                    ]
                }
            ]
        },
        {
            id: 'paspects',
            name: 'pc-ASPECTS (Posterior)',
            initialScore: 10,
            slices: [
                {
                    id: 'pc_midbrain',
                    imageId: CLINICAL_IMAGES.PC_RAD_1, 
                    title: "Mesencéfalo (2 pts)",
                    regions: [
                        { id: 'midbrain', name: 'Mesencéfalo', value: 2, side: 'C' as const, points: "182,261 190,252 199,247 208,249 211,258 213,265 218,268 223,260 228,254 235,253 241,253 248,254 253,260 254,272 253,281 247,292 238,302 231,312 223,313 215,307 206,314 201,315 196,306 190,298 185,288 182,279 180,272" }
                    ]
                },
                {
                    id: 'pc_thalamus',
                    imageId: CLINICAL_IMAGES.ASPECTS_G, 
                    title: "Tálamo / Occipital",
                    regions: [
                        { id: 'th_l', name: 'Tálamo (Esq)', value: 1, side: 'L' as const, points: "241,295 250,300 262,303 273,303 280,299 278,289 266,279 257,270 246,259 237,247 232,235 226,230 221,231 216,242 215,253 214,262 217,271 223,279 228,286 234,290 237,293" },
                        { id: 'th_r', name: 'Tálamo (Dir)', value: 1, side: 'R' as const, points: "194,271 200,263 206,249 202,232 191,233 178,244 167,255 163,263 157,267 152,274 145,281 140,286 141,297 148,300 159,298 170,289 180,286 188,280" },
                        { id: 'occ_l', name: 'Lobo Occipital (Esq)', value: 1, side: 'L' as const, points: "320,380 313,368 307,363 299,359 290,354 280,348 271,345 262,345 253,345 246,346 234,351 227,355 221,359 215,364 210,372 208,381 209,393 209,403 209,412 210,420 210,427 217,432 225,436 234,439 242,439 250,439 259,436 269,432 279,426 288,418 297,414 305,404 311,396 317,388" },
                        { id: 'occ_r', name: 'Lobo Occipital (Dir)', value: 1, side: 'R' as const, points: "144,345 135,350 126,355 116,368 114,375 110,381 109,387 110,397 122,408 135,418 142,423 151,428 159,433 167,436 178,433 186,432 194,433 198,425 199,417 199,407 199,398 199,387 197,381 191,373 185,367 178,358 171,353 161,349 152,346" }
                    ]
                },
                {
                    id: 'pc_pons',
                    imageId: CLINICAL_IMAGES.PC_RAD_2, 
                    title: "Ponte / Cerebelo",
                    regions: [
                        { id: 'pons', name: 'Ponte (2 pts)', value: 2, side: 'C' as const, points: "251,298 244,308 238,314 231,318 220,318 211,315 200,317 190,306 184,299 179,293 180,281 185,271 194,260 202,256 214,254 229,256 239,258 246,265 252,277 255,284 255,289" },
                        { id: 'cb_l', name: 'H. Cerebelar (Esq)', value: 1, side: 'L' as const, points: "223,399 221,385 221,371 222,356 225,345 230,334 238,326 249,318 260,311 270,306 280,308 289,314 297,319 305,323 317,329 323,334 331,342 337,349 333,360 329,369 322,378 317,385 308,392 298,398 285,403 270,407 256,411 243,413 230,408" },
                        { id: 'cb_r', name: 'H. Cerebelar (Dir)', value: 1, side: 'R' as const, points: "212,392 212,336 197,321 187,312 181,306 165,299 151,298 137,308 121,324 106,333 102,341 101,356 107,370 114,384 121,393 131,399 142,402 156,406 171,407 182,408 195,406 204,403" }
                    ]
                }
            ]
        }
    ]
};

const THROMBOLYSIS_CRITERIA = {
  inclusion: [
    { id: 'inc_1', text: "Diagnóstico clínico de AVC isquêmico agudo.", note: "Déficit neurológico focal mensurável." },
    { id: 'inc_2', text: "Início dos sintomas < 4.5 horas.", note: "Ou despertar (Wake-Up) com mismatch DWI-FLAIR." },
    { id: 'inc_3', text: "Idade ≥ 18 anos (Padrão).", note: "Nota 2026: Em crianças (28 dias-18 anos), IVT com Alteplase pode ser considerada (Grau 2b)." }
  ],
  exclusion: {
    history: [
      { id: 'exh_1', text: "AVC isquêmico ou TCE grave nos últimos 3 meses.", note: "" },
      { id: 'exh_2', text: "História de hemorragia intracraniana prévia.", note: "Absoluta." },
      { id: 'exh_3', text: "Neoplasia intracraniana intra-axial.", note: "" },
      { id: 'exh_4', text: "Malignidade gastrointestinal com sangramento recente.", note: "GI nos últimos 21 dias." },
      { id: 'exh_6', text: "Cirurgia intracraniana/espinhal recente.", note: "Últimos 3 meses." }
    ],
    clinical: [
      { id: 'exc_1', text: "Sintomas sugestivos de HSA.", note: "" },
      { id: 'exc_2', text: "PAS ≥ 185 ou PAD ≥ 110 mmHg persistente.", note: "Tratar antes de iniciar IVT." },
      { id: 'exc_3', text: "Sangramento interno ativo.", note: "" },
      { id: 'exc_4', text: "Suspeita de Endocardite ou Dissecção de Aorta.", note: "" },
      { id: 'exc_6', text: "Diátese hemorrágica aguda.", note: "" }
    ],
    hematologic: [
      { id: 'exm_1', text: "Plaquetas < 100.000/mm³.", note: "" },
      { id: 'exm_2', text: "Uso de Varfarina com INR > 1.7.", note: "" },
      { id: 'exm_4', text: "Heparina plena nas últimas 24h com TTPa alargado.", note: "" }
    ],
    imaging: [
      { id: 'exi_1', text: "Hemorragia na TC (Intra ou Extra-axial).", note: "" },
      { id: 'exi_2', text: "Hipodensidade extensa (> 1/3 ACM).", note: "Considerar Trombectomia (EVT) se Large Core." }
    ]
  },
  warnings: [
    { id: 'warn_1', text: "Deficits leves não incapacitantes.", note: "IVT NÃO RECOMENDADA. Indicação: DAPT (Aspirina + Clopidogrel) por 21 dias." },
    { id: 'warn_2', text: "Uso de DOACs (Rivaroxabana, Apixabana) < 48h.", note: "Contraindicação RELATIVA (2026). Avaliar risco/benefício ou reversão específica se disponível." },
    { id: 'warn_3', text: "Tenecteplase é preferencial em LVO.", note: "0.25mg/kg em bolus único." },
    { id: 'warn_4', text: "Antitrombóticos Adjuvantes (ex: Argatroban)", note: "NÃO RECOMENDADO (Sem benefício comprovado)." }
  ],
  extended: [
    { id: 'ext_1', title: 'Wake-Up Stroke (Início Indeterminado)', criteria: 'Mismatch DWI-FLAIR na RM: Lesão aguda visível em DWI mas AUSENTE em FLAIR. Sugere início < 4.5h. Candidato a IVT.' },
    { id: 'ext_2', title: 'Janela 4.5h - 9h (Perfusão)', criteria: 'Mismatch Perfusional (CTP ou PWI): Core isquêmico < 70ml, Razão de Mismatch > 1.2 e Volume de Mismatch > 10ml (EXTEND criteria). IVT pode ser considerada.' },
    { id: 'ext_3', title: 'Circulação Posterior (Basilar)', criteria: 'Para oclusão de Basilar, a Trombectomia (EVT) é mandatória até 24h (Nível 1A). IVT em janela estendida (>4.5h) é menos estabelecida que EVT, mas pode ser considerada em protocolos de pesquisa ou ponte.' }
  ]
};

const POST_THROMBOLYSIS_CARE = {
    monitoring: [
        { time: 'Primeiras 2h', frequency: 'A cada 15 minutos', activities: ['Sinais Vitais', 'NIHSS Simplificado', 'Acesso Venoso', 'Local da punção'] },
        { time: 'Próximas 6h', frequency: 'A cada 30 minutos', activities: ['Sinais Vitais', 'Status Neurológico'] },
        { time: 'Até as 24h', frequency: 'A cada 1 hora', activities: ['Sinais Vitais', 'Status Neurológico'] }
    ],
    bp_goals: {
        target: 'PAS < 180 mmHg e PAD < 105 mmHg',
        measures: [
            'Se PAS 180–230 ou PAD 105–120: Labetalol 10mg IV (1-2 min). Pode repetir.',
            'Ou Nicardipina 5mg/h IV, aumentar 2.5mg/h a cada 5-15 min (máx 15mg/h).',
            'Se PA não controlada ou PAD > 140: Nitroprussiato de Sódio.'
        ]
    },
    general_care: [
        { title: 'Janela de 24h', content: 'Sem AAS, Heparina ou Clopidogrel nas primeiras 24h pós-trombólise.' },
        { title: 'Deglutição', content: 'NADA por via oral (NPO) até rastreio formal de deglutição.' },
        { title: 'Sondagem', content: 'Evitar sondagem vesical, gástrica ou punções arteriais por 24h.' },
        { title: 'Neuroimagem', content: 'TC de Crânio de controle em 24h ou IMEDIATAMENTE se piora neurológica.' },
        { title: 'Glicemia', content: 'Meta: 140 - 180 mg/dL. Evitar hipoglicemia (< 60 mg/dL).' }
    ],
    complications: [
        { title: 'Hemorragia Intracraniana (sICH)', content: 'Parar infusão, TC urgente, Crioprecipitado (10U), Ácido Tranexâmico (1g IV).' },
        { title: 'Angioedema Orofacial', content: 'Monitorar via aérea, Parar infusão, Metilprednisolona (125mg), Ranitidina (50mg), Adrenalina se necessário.' }
    ]
};

const EVT_CRITERIA = [
    {
        title: "Janela Precoce (0-6h)",
        subtitle: "Oclusão de Grande Vaso (LVO) - Circulação Anterior",
        criteria: [
            "Idade ≥ 18 anos.",
            "NIHSS ≥ 6.",
            "ASPECTS ≥ 6 (Padrão).",
            "ASPECTS 3-5 (Large Core) - Nova Recomendação Forte (2026) para reduzir mortalidade/incapacidade.",
            "mRS prévio 0-1 (Independente)."
        ],
        action: "Trombectomia Mecânica Imediata (Nível 1A)."
    },
    {
        title: "Janela Estendida (6-24h)",
        subtitle: "LVO Anterior (DAWN / DEFUSE-3 Criteria)",
        criteria: [
            "Mismatch Clínico-Radiológico (DAWN) ou Perfusional (DEFUSE-3).",
            "Volume de Core Isquêmico < 70ml (Perfusão).",
            "Mismatch Ratio ≥ 1.8.",
            "Volume de Penumbra ≥ 15ml."
        ],
        action: "Trombectomia se elegível."
    },
    {
        title: "Circulação Posterior (Basilar)",
        subtitle: "Oclusão de Artéria Basilar (0-24h)",
        criteria: [
            "NIHSS ≥ 10.",
            "pc-ASPECTS ≥ 6 (Dano isquêmico leve).",
            "Janela de até 24 horas do início.",
            "mRS prévio 0-1."
        ],
        action: "Recomendação Forte (Diretriz 2026)."
    }
];

const AspectsCombinedViewer: React.FC<{ 
    slices: InteractiveSlice[]; 
    selectedRegions: Set<string>; 
    onToggle: (id: string) => void;
}> = ({ slices, selectedRegions, onToggle }) => {
    return (
        <div className="flex flex-col items-center w-full py-2 space-y-4 overflow-hidden">
            <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
                {slices.map((slice) => (
                    <div key={slice.id} className="relative w-full aspect-[400/540] bg-black rounded-[1.5rem] shadow-lg border-2 border-slate-200 dark:border-zinc-800 overflow-hidden select-none transition-transform active:scale-[0.98]">
                        <svg viewBox="0 0 400 540" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <image href={slice.imageId} x="0" y="0" width="400" height="540" preserveAspectRatio="xMidYMid meet" />
                            {slice.regions.map(r => {
                                const isSelected = selectedRegions.has(r.id);
                                return (
                                    <polygon key={r.id} points={r.points} onClick={() => onToggle(r.id)} className={`transition-all duration-200 cursor-pointer ${isSelected ? 'fill-red-600/70 stroke-white' : 'fill-red-500/10 hover:fill-red-500/40 stroke-white/40 hover:stroke-white'}`} style={{ strokeWidth: isSelected ? '3px' : '1.5px', vectorEffect: 'non-scaling-stroke' }}><title>{r.name}</title></polygon>
                                );
                            })}
                        </svg>
                        <div className="absolute top-2 left-0 w-full text-center pointer-events-none">
                            <span className="bg-black/70 backdrop-blur-md text-white text-[8px] font-black uppercase px-3 py-1 rounded-full border border-white/10 tracking-widest shadow-lg">{slice.title}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-1 max-w-lg px-4 pb-4">
                {slices.flatMap(s => s.regions).map(r => (
                    <button key={r.id} onClick={() => onToggle(r.id)} className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-tight border transition-all active:scale-95 ${selectedRegions.has(r.id) ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400 hover:border-red-400'}`}>{r.name}</button>
                ))}
            </div>
        </div>
    );
};

// --- NEW TOOLS DATA ---
const NEW_TOOLS: CalcTool[] = [
  {
    id: 'mrs',
    name: 'Escala de Rankin Modificada (mRS)',
    description: 'Avaliação global de incapacidade funcional pós-AVC.',
    icon: Activity,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    questions: [
        { id: 'score', text: 'Selecione o grau de incapacidade:', type: 'radio', options: [
            { value: 0, label: '0 - Assintomático. Sem sintomas de qualquer tipo.' },
            { value: 1, label: '1 - Sem incapacidade significativa. Tem sintomas, mas realiza todas as tarefas habituais.' },
            { value: 2, label: '2 - Incapacidade leve. Incapaz de realizar atividades prévias, mas independente para autocuidado.' },
            { value: 3, label: '3 - Incapacidade moderada. Requer alguma ajuda (ex: finanças, compras), mas caminha sem assistência.' },
            { value: 4, label: '4 - Incapacidade moderadamente grave. Incapaz de caminhar sem ajuda e de cuidar das necessidades corporais.' },
            { value: 5, label: '5 - Incapacidade grave. Confinado ao leito, incontinente, requer enfermagem constante.' },
            { value: 6, label: '6 - Óbito.' }
        ]}
    ],
    interpretation: (score) => {
        if (score >= 6) return { text: 'Óbito', color: 'text-slate-500', bg: 'bg-slate-100' };
        if (score >= 4) return { text: 'Dependência Grave', color: 'text-red-600', bg: 'bg-red-50' };
        if (score >= 3) return { text: 'Dependência Moderada', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'Independência Funcional', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'abcd2',
    name: 'Escore ABCD²',
    description: 'Risco de AVC após AIT em 2, 7 e 90 dias.',
    icon: FileBarChart,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    questions: [
        { id: 'age', text: 'Idade ≥ 60 anos', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'bp', text: 'Pressão Arterial ≥ 140/90 mmHg', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'clinic', text: 'Características Clínicas do Evento', options: [{value:2, label:'Fraqueza unilateral (+2)'}, {value:1, label:'Alteração de fala s/ fraqueza (+1)'}, {value:0, label:'Outros sintomas'}] },
        { id: 'dur', text: 'Duração dos Sintomas', options: [{value:2, label:'≥ 60 min (+2)'}, {value:1, label:'10-59 min (+1)'}, {value:0, label:'< 10 min'}] },
        { id: 'diab', text: 'Diabetes Mellitus', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] }
    ],
    interpretation: (score) => {
        if (score >= 6) return { text: 'Alto Risco (Internação) - AVC em 2d: 8.1%', color: 'text-red-600', bg: 'bg-red-50' };
        if (score >= 4) return { text: 'Risco Moderado - AVC em 2d: 4.1%', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'Baixo Risco - AVC em 2d: 1.0%', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'ich',
    name: 'ICH Score',
    description: 'Mortalidade em 30 dias na hemorragia intracerebral.',
    icon: AlertOctagon,
    color: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    questions: [
        { id: 'gcs', text: 'Escala de Coma de Glasgow (ECG)', options: [{value:2, label:'3-4 (+2)'}, {value:1, label:'5-12 (+1)'}, {value:0, label:'13-15'}] },
        { id: 'vol', text: 'Volume do Hematoma (ABC/2)', options: [{value:1, label:'≥ 30 cm³ (+1)'}, {value:0, label:'< 30 cm³'}] },
        { id: 'ivh', text: 'Hemorragia Intraventricular', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'infra', text: 'Origem Infratentorial', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'age', text: 'Idade ≥ 80 anos', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] }
    ],
    interpretation: (score) => {
        const mort = [0, 13, 26, 72, 97, 100, 100];
        return { text: `Mortalidade em 30 dias: ~${mort[Math.min(score, 6)]}%`, color: score >= 3 ? 'text-red-600' : 'text-blue-500', bg: score >= 3 ? 'bg-red-50' : 'bg-blue-50' };
    }
  },
  {
    id: 'chads',
    name: 'CHA₂DS₂-VASc',
    description: 'Risco de AVC na Fibrilação Atrial.',
    icon: Heart,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    questions: [
        { id: 'c', text: 'Insuficiência Cardíaca Congestiva / Disfunção VE', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'h', text: 'Hipertensão Arterial', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'a2', text: 'Idade ≥ 75 anos', options: [{value:2, label:'Sim (+2)'}, {value:0, label:'Não'}] },
        { id: 'd', text: 'Diabetes Mellitus', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 's2', text: 'AVC / AIT / Tromboembolismo Prévio', options: [{value:2, label:'Sim (+2)'}, {value:0, label:'Não'}] },
        { id: 'v', text: 'Doença Vascular (IAM prévio, DAP, Placa Aórtica)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'a', text: 'Idade 65-74 anos', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'sc', text: 'Categoria de Sexo (Feminino)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Masculino'}] }
    ],
    interpretation: (score) => {
        if (score >= 2) return { text: 'Alto Risco: Anticoagulação Oral Recomendada', color: 'text-red-600', bg: 'bg-red-50' };
        if (score === 1) return { text: 'Risco Intermediário: Considerar Anticoagulação', color: 'text-orange-500', bg: 'bg-orange-50' };
        return { text: 'Baixo Risco: Nenhuma terapia antitrombótica', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'hasbled',
    name: 'HAS-BLED',
    description: 'Risco de sangramento em anticoagulação.',
    icon: Droplets,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    questions: [
        { id: 'h', text: 'Hipertensão não controlada (PAS > 160 mmHg)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'a_r', text: 'Função Renal Anormal (Diálise, Transplante, Cr > 2.26)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'a_l', text: 'Função Hepática Anormal (Cirrose, Bilirrubina > 2x, Transaminases > 3x)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 's', text: 'História de AVC Prévio', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'b', text: 'História de Sangramento ou Predisposição (Anemia)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'l', text: 'INR Lábil (Tempo na faixa < 60%)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'e', text: 'Idade > 65 anos', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'd_d', text: 'Uso de Drogas (Antiplaquetários / AINEs)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'd_a', text: 'Uso de Álcool (> 8 doses/semana)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] }
    ],
    interpretation: (score) => {
        if (score >= 3) return { text: 'Alto Risco de Sangramento (Monitorar Frequente)', color: 'text-red-600', bg: 'bg-red-50' };
        return { text: 'Baixo Risco', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'padua',
    name: 'Escala de Pádua',
    description: 'Risco de TEV em pacientes clínicos internados.',
    icon: Stethoscope,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    questions: [
        { id: 'cancer', text: 'Câncer Ativo', options: [{value:3, label:'Sim (+3)'}, {value:0, label:'Não'}] },
        { id: 'vte', text: 'TEV Prévio (excluindo trombose superficial)', options: [{value:3, label:'Sim (+3)'}, {value:0, label:'Não'}] },
        { id: 'mob', text: 'Mobilidade Reduzida (ao menos 3 dias)', options: [{value:3, label:'Sim (+3)'}, {value:0, label:'Não'}] },
        { id: 'tromb', text: 'Trombofilia Conhecida', options: [{value:3, label:'Sim (+3)'}, {value:0, label:'Não'}] },
        { id: 'trauma', text: 'Trauma ou Cirurgia Recente (<= 1 mês)', options: [{value:2, label:'Sim (+2)'}, {value:0, label:'Não'}] },
        { id: 'age', text: 'Idade ≥ 70 anos', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'insuf', text: 'Insuficiência Cardíaca ou Respiratória', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'ami', text: 'IAM ou AVC Isquêmico Agudo', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'infec', text: 'Infecção Aguda ou Doença Reumatológica', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'obes', text: 'Obesidade (IMC >= 30)', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] },
        { id: 'horm', text: 'Tratamento Hormonal em curso', options: [{value:1, label:'Sim (+1)'}, {value:0, label:'Não'}] }
    ],
    interpretation: (score) => {
        if (score >= 4) return { text: 'Alto Risco de TEV (Indicação Profilaxia)', color: 'text-red-600', bg: 'bg-red-50' };
        return { text: 'Baixo Risco', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'ottawa',
    name: 'Regra de Ottawa para HSA',
    description: 'Sensibilidade de 100% para descartar HSA em cefaleia aguda.',
    icon: Siren,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    questions: [
        { id: 'age', text: 'Idade ≥ 40 anos', options: [{value:1, label:'Sim'}, {value:0, label:'Não'}] },
        { id: 'neck', text: 'Dor ou Rigidez de Nuca', options: [{value:1, label:'Sim'}, {value:0, label:'Não'}] },
        { id: 'loc', text: 'Perda de Consciência Testemunhada', options: [{value:1, label:'Sim'}, {value:0, label:'Não'}] },
        { id: 'exertion', text: 'Início durante esforço físico', options: [{value:1, label:'Sim'}, {value:0, label:'Não'}] },
        { id: 'thunder', text: 'Cefaleia em Trovão (pico instantâneo)', options: [{value:1, label:'Sim'}, {value:0, label:'Não'}] },
        { id: 'flexion', text: 'Limitação da flexão cervical ao exame', options: [{value:1, label:'Sim'}, {value:0, label:'Não'}] }
    ],
    interpretation: (score) => {
        if (score >= 1) return { text: 'Investigação Necessária (TC/LCR)', color: 'text-red-600', bg: 'bg-red-50' };
        return { text: 'HSA Descartada (Sensibilidade 100%)', color: 'text-emerald-500', bg: 'bg-emerald-50' };
    }
  },
  {
    id: 'hunt',
    name: 'Hunt & Hess',
    description: 'Gravidade clínica na HSA.',
    icon: Activity,
    color: 'text-lime-600',
    bg: 'bg-lime-50 dark:bg-lime-900/20',
    questions: [
        { id: 'grade', text: 'Selecione a apresentação clínica:', type: 'radio', options: [
            { value: 1, label: 'Grau 1 - Assintomático ou cefaleia leve e rigidez de nuca mínima.' },
            { value: 2, label: 'Grau 2 - Cefaleia moderada a grave, rigidez de nuca, sem déficit neurológico (exceto paralisia de nervo craniano).' },
            { value: 3, label: 'Grau 3 - Sonolência, confusão ou déficit focal leve.' },
            { value: 4, label: 'Grau 4 - Estupor, hemiparesia moderada a grave, possivelmente rigidez de descerebração precoce.' },
            { value: 5, label: 'Grau 5 - Coma profundo, rigidez de descerebração, aparência moribunda.' }
        ]}
    ],
    interpretation: (score) => {
        const mort = ['Mínima', 'Baixa', 'Média', 'Alta', 'Muito Alta'];
        return { text: `Mortalidade Estimada: ${mort[Math.max(0, score-1)]}`, color: score >= 4 ? 'text-red-600' : 'text-blue-500', bg: score >= 4 ? 'bg-red-50' : 'bg-blue-50' };
    }
  },
  {
    id: 'fisher',
    name: 'Fisher Modificado',
    description: 'Risco de vasoespasmo na HSA (TC).',
    icon: Scan,
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    questions: [
        { id: 'grade', text: 'Achados na Tomografia:', type: 'radio', options: [
            { value: 0, label: 'Grau 0 - Sem hemorragia subaracnóidea ou intraventricular.' },
            { value: 1, label: 'Grau 1 - HSA focal ou difusa fina (< 1mm de espessura), sem hemorragia intraventricular.' },
            { value: 2, label: 'Grau 2 - HSA focal ou difusa fina (< 1mm de espessura), COM hemorragia intraventricular.' },
            { value: 3, label: 'Grau 3 - HSA espessa (> 1mm de espessura), sem hemorragia intraventricular.' },
            { value: 4, label: 'Grau 4 - HSA espessa (> 1mm de espessura), COM hemorragia intraventricular.' }
        ]}
    ],
    interpretation: (score) => {
        const risk = ['0%', '24%', '33%', '33%', '40%'];
        return { text: `Risco de Vasoespasmo Sintomático: ~${risk[score]}`, color: score >= 3 ? 'text-red-600' : 'text-emerald-500', bg: score >= 3 ? 'bg-red-50' : 'bg-emerald-50' };
    }
  }
];

export const NeurovascularTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // States do Protocolo Trombólise
  const [protocolStep, setProtocolStep] = useState(0);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [activeSubModule, setActiveSubModule] = useState<string>('aspects'); 
  const [patientWeight, setPatientWeight] = useState<string>('');
  const [ictusTime, setIctusTime] = useState<string>('');
  const [criteriaCheck, setCriteriaCheck] = useState<Set<string>>(new Set());
  const [mrsPrevio, setMrsPrevio] = useState<string>('');
  const [vitalPAS, setVitalPAS] = useState<string>('');
  const [vitalPAD, setVitalPAD] = useState<string>('');
  const [vitalFC, setVitalFC] = useState<string>('');
  const [glycemia, setGlycemia] = useState<string>('');
  
  // Novo Estado: Agente Trombolítico
  const [thrombolyticAgent, setThrombolyticAgent] = useState<'alteplase' | 'tenecteplase'>('tenecteplase');

  // --- LOGIC THROMBOLYSIS ---
  const nihssScore = useMemo(() => {
      return THROMBOLYSIS_TOOL.questions.reduce((acc, q) => {
          const val = scores[q.id];
          return acc + (Number(val) || 0);
      }, 0);
  }, [scores]);

  const calculateAspectsScore = (moduleId: string) => {
      const sub = THROMBOLYSIS_TOOL.subModules.find(s => s.id === moduleId);
      if (!sub) return 10;
      let score = sub.initialScore;
      const allRegions = sub.slices.flatMap(s => s.regions);
      selectedRegions.forEach(regionId => {
          const region = allRegions.find(r => r.id === regionId);
          if (region) score -= region.value;
      });
      return Math.max(0, score);
  };

  const aspectsScore = useMemo(() => calculateAspectsScore('aspects'), [selectedRegions]);
  const pcAspectsScore = useMemo(() => calculateAspectsScore('paspects'), [selectedRegions]);

  const handleRegionClick = (regionId: string) => {
      setSelectedRegions(prev => {
          const next = new Set(prev);
          if (next.has(regionId)) next.delete(regionId);
          else next.add(regionId);
          return next;
      });
  };

  const calculateDosage = () => {
      const w = parseFloat(patientWeight);
      if (!w || isNaN(w)) return null;

      if (thrombolyticAgent === 'alteplase') {
        const dosingWeight = Math.min(w, 100); 
        const total = dosingWeight * 0.9;
        const bolus = total * 0.1;
        const infusion = total * 0.9;
        return { drug: 'Alteplase', total: total.toFixed(1), bolus: bolus.toFixed(1), infusion: infusion.toFixed(1), weight: w.toFixed(0), max: 90 };
      } else {
        // Tenecteplase: 0.25mg/kg, max 25mg
        const total = Math.min(w * 0.25, 25);
        return { drug: 'Tenecteplase', total: total.toFixed(1), bolus: total.toFixed(1), infusion: 0, weight: w.toFixed(0), max: 25 };
      }
  };

  const generateReport = () => {
      const dosage = calculateDosage();
      const nihssDetails = THROMBOLYSIS_TOOL.questions.map(q => `${q.id.toUpperCase()}:${scores[q.id]||0}`).join(' | ');
      let report = `PROTOCOLO DE AVC AGUDO (2026)\n`;
      report += `Ictus: ${ictusTime || 'N/A'}\n`;
      report += `mRS Prévio: ${mrsPrevio !== '' ? `mRS ${mrsPrevio}` : 'Não informado'}\n`;
      report += `Dados Vitais: ${vitalPAS && vitalPAD ? `PA ${vitalPAS}/${vitalPAD} mmHg` : 'PA não informada'} ${vitalFC ? `| FC ${vitalFC} bpm` : ''}\n`;
      report += `Glicemia: ${glycemia ? `${glycemia} mg/dL` : 'Não informada'}\n`;
      report += `NIHSS: ${nihssScore} (${nihssDetails})\n`;
      report += `ASPECTS: ${aspectsScore} | pc-ASPECTS: ${pcAspectsScore}\n`;
      if(dosage) {
          if (dosage.drug === 'Alteplase') {
             report += `Alteplase (0.9 mg/kg): Total ${dosage.total}mg | Bolus ${dosage.bolus}mg | Infusão ${dosage.infusion}mg\n`;
          } else {
             report += `Tenecteplase (0.25 mg/kg): Bolus Único ${dosage.total}mg\n`;
          }
      }
      
      // CUIDADOS PÓS-AVC (PÓS-TROMBÓLISE)
      report += `\nCUIDADOS PÓS-TROMBÓLISE (24 HORAS):\n`;
      report += `- Alvo Pressórico: ${POST_THROMBOLYSIS_CARE.bp_goals.target}\n`;
      POST_THROMBOLYSIS_CARE.bp_goals.measures.forEach(m => {
          report += `  • ${m}\n`;
      });
      report += `- Monitorização Clínica:\n`;
      POST_THROMBOLYSIS_CARE.monitoring.forEach(m => {
          report += `  • ${m.time} (${m.frequency}): ${m.activities.join(' • ')}\n`;
      });
      report += `- Cuidados Gerais:\n`;
      POST_THROMBOLYSIS_CARE.general_care.forEach(c => {
          report += `  • ${c.title}: ${c.content}\n`;
      });
      
      return report;
  };

  const handleFinishThrombolysis = async () => {
      const reportText = generateReport();
      navigator.clipboard.writeText(reportText);
      if (user) await syncEngine.enqueue('clinical_reports', { id: crypto.randomUUID(), user_id: user.id, tool_id: 'thrombolysis', tool_name: 'Protocolo de AVC', nihss_score: nihssScore, nihss_detail: reportText, aspects_score: aspectsScore, pc_aspects_score: pcAspectsScore, weight: patientWeight, created_at: new Date().toISOString() });
      alert("Relatório copiado!");
      setActiveToolId(null);
  };

  const renderThrombolysis = () => (
    <div className="space-y-6 animate-in fade-in pb-40 w-full">
        <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-2xl mb-4 overflow-x-auto no-scrollbar shadow-inner shrink-0 w-full">
            {['NIHSS', 'Neuroimagem', 'Critérios', 'Trombólise', 'Cuidados Pós', 'Trombectomia'].map((stepName, i) => (
                <button key={i} onClick={() => setProtocolStep(i)} className={`flex-1 min-w-[90px] px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${protocolStep === i ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>{stepName}</button>
            ))}
        </div>
        {protocolStep === 0 && (
            <div className="space-y-4 animate-in fade-in w-full">
                 {THROMBOLYSIS_TOOL.questions.map((q) => (
                    <section key={q.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm overflow-hidden group w-full">
                      <div className="flex justify-between items-start mb-4"><h4 className="text-lg font-black text-slate-950 dark:text-white leading-tight pr-4">{q.text}</h4>{scores[q.id] !== undefined && <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center text-white font-black text-xs">{scores[q.id]}</div>}</div>
                      {q.images?.map((img, i) => (<SmartImage key={i} url={img} alt="Ref" onDoubleClick={() => setFullscreenImage(img)} className="w-full aspect-video md:aspect-[21/9] object-contain bg-black rounded-2xl mb-6 shadow-inner border border-white/5" />))}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt) => (<button key={opt.label} onClick={() => setScores(prev => ({ ...prev, [q.id]: opt.value }))} className={`text-left p-4 rounded-2xl text-[12px] font-black border-2 transition-all active:scale-[0.98] ${scores[q.id] === opt.value ? 'bg-primary border-primary text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800 text-slate-500 hover:border-slate-300'}`}>{opt.value} - {opt.label}</button>))}
                      </div>
                    </section>
                 ))}
                 <div className="bg-primary/5 border-2 border-primary/20 p-6 rounded-[2rem] flex justify-between items-center shadow-sm w-full">
                     <div className="flex items-center gap-4"><div className="p-3 bg-primary rounded-2xl shadow-lg shadow-emerald-500/20"><Activity className="h-6 w-6 text-white" /></div><div><h4 className="font-black text-primary text-base uppercase tracking-tight leading-none">NIHSS TOTAL</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Neurológico</p></div></div>
                     <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{nihssScore}</span>
                 </div>
            </div>
        )}
        {protocolStep === 1 && (
            <div className="animate-in fade-in space-y-6 w-full">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-zinc-900 flex flex-col items-center justify-center shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">ASPECTS (Anterior)</p><span className="text-4xl font-black text-primary tracking-tighter">{aspectsScore}</span></div>
                     <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-zinc-900 flex flex-col items-center justify-center shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">pc-ASPECTS (Post)</p><span className="text-4xl font-black text-primary tracking-tighter">{pcAspectsScore}</span></div>
                 </div>
                 <div className="flex bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-[1.5rem] w-fit mx-auto shadow-inner">
                    {['aspects', 'paspects'].map(subId => (<button key={subId} onClick={() => setActiveSubModule(subId)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubModule === subId ? 'bg-white dark:bg-zinc-800 text-primary shadow-md' : 'text-slate-500'}`}>{subId === 'aspects' ? 'Fosseta ACM' : 'Fossa Posterior'}</button>))}
                </div>
                <AspectsCombinedViewer slices={THROMBOLYSIS_TOOL.subModules.find(s => s.id === activeSubModule)!.slices as InteractiveSlice[]} selectedRegions={selectedRegions} onToggle={handleRegionClick} />
            </div>
        )}
        {protocolStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-bottom-5 w-full">
                <div className="bg-indigo-600 text-white p-5 rounded-[2rem] shadow-xl flex items-start gap-4"><div className="bg-white/20 p-2.5 rounded-xl"><Info className="h-6 w-6 text-white" /></div><div><h4 className="text-sm font-black uppercase tracking-tight">Novos Critérios 2026</h4><p className="text-[10px] font-medium leading-relaxed opacity-90 mt-1">Tenecteplase (0.25 mg/kg) é agora recomendado sobre Alteplase em LVO. Janelas estendidas até 24h são possíveis.</p></div></div>
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm"><h4 className="text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest mb-4 flex items-center"><Timer className="h-4 w-4 mr-2 text-primary" /> Tempo de Ictus (Janela de Ouro)</h4><input type="text" value={ictusTime} onChange={e => setIctusTime(e.target.value)} placeholder="Ex: 2 horas" className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl text-xl font-black text-center" /></div>
                
                {/* mRS Prévio do Paciente */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-primary" /> mRS Prévio do Paciente
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6].map((score) => (
                            <button
                                key={score}
                                type="button"
                                onClick={() => setMrsPrevio(score.toString())}
                                className={`py-2 rounded-xl text-xs font-black border transition-all ${
                                    mrsPrevio === score.toString()
                                        ? 'bg-primary border-primary text-white shadow-lg'
                                        : 'bg-slate-50 dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-500 hover:border-slate-300'
                                }`}
                            >
                                {score}
                            </button>
                        ))}
                    </div>
                    {mrsPrevio !== '' && (
                        <p className="text-[9px] text-primary font-black uppercase tracking-wider mt-1.5 pl-1">
                            {mrsPrevio === '0' && '0 - Assintomático'}
                            {mrsPrevio === '1' && '1 - Sintomas leves sem incapacidade'}
                            {mrsPrevio === '2' && '2 - Incapacidade leve (independente)'}
                            {mrsPrevio === '3' && '3 - Incapacidade moderada (requer alguma ajuda, caminha só)'}
                            {mrsPrevio === '4' && '4 - Incapacidade moderadamente grave (não caminha sem ajuda)'}
                            {mrsPrevio === '5' && '5 - Incapacidade grave (acamado, enfermagem constante)'}
                            {mrsPrevio === '6' && '6 - Óbito'}
                        </p>
                    )}
                </div>

                {/* Dados Vitais e Glicemia */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest mb-4 flex items-center">
                        <Heart className="h-4 w-4 mr-2 text-rose-500" /> Dados Vitais e Glicemia
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider pl-1 block">PAS (mmHg)</label>
                            <input 
                                type="number" 
                                value={vitalPAS} 
                                onChange={e => setVitalPAS(e.target.value)} 
                                placeholder="120" 
                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-center text-sm font-black focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider pl-1 block">PAD (mmHg)</label>
                            <input 
                                type="number" 
                                value={vitalPAD} 
                                onChange={e => setVitalPAD(e.target.value)} 
                                placeholder="80" 
                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-center text-sm font-black focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider pl-1 block">FC (bpm)</label>
                            <input 
                                type="number" 
                                value={vitalFC} 
                                onChange={e => setVitalFC(e.target.value)} 
                                placeholder="80" 
                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-center text-sm font-black focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider pl-1 block">Glicemia (mg/dL)</label>
                            <input 
                                type="number" 
                                value={glycemia} 
                                onChange={e => setGlycemia(e.target.value)} 
                                placeholder="100" 
                                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 p-3 rounded-xl text-center text-sm font-black focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
                
                {/* WIDGET JANELA ESTENDIDA (NOVO) */}
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/40 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-indigo-700 dark:text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2"><Clock className="h-4 w-4" /> Critérios para Janela Estendida (4.5h - 24h)</h4>
                    <div className="space-y-2">
                        {THROMBOLYSIS_CRITERIA.extended?.map((c) => (
                             <div key={c.id} className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-indigo-100 dark:border-indigo-900 hover:bg-indigo-50/50 transition-colors">
                                 <h5 className="text-xs font-black text-indigo-950 dark:text-indigo-100 leading-tight mb-1">{c.title}</h5>
                                 <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">{c.criteria}</p>
                             </div>
                        ))}
                    </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/40 rounded-[2rem] p-6 shadow-sm"><h4 className="text-emerald-700 dark:text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Critérios de Inclusão</h4><div className="space-y-2">{THROMBOLYSIS_CRITERIA.inclusion.map((c) => (<label key={c.id} className="flex flex-col cursor-pointer p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-50/50 transition-colors"><div className="flex items-start"><div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 mr-3 transition-all ${criteriaCheck.has(c.id) ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-emerald-300'}`}>{criteriaCheck.has(c.id) && <Check className="h-3 w-3 text-white stroke-[4px]" />}</div><input type="checkbox" className="hidden" onChange={() => { const next = new Set(criteriaCheck); if(next.has(c.id)) next.delete(c.id); else next.add(c.id); setCriteriaCheck(next); }} /><span className="text-xs font-black text-emerald-950 dark:text-emerald-100 leading-tight">{c.text}</span></div>{c.note && <p className="text-[9px] font-bold text-emerald-600 mt-2 ml-8 uppercase opacity-60 italic">{c.note}</p>}</label>))}</div></div>
                <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/40 rounded-[2rem] p-6 shadow-sm"><h4 className="text-rose-700 dark:text-rose-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2"><Ban className="h-4 w-4" /> Contraindicações Absolutas</h4><div className="space-y-2">{[...THROMBOLYSIS_CRITERIA.exclusion.history, ...THROMBOLYSIS_CRITERIA.exclusion.clinical, ...THROMBOLYSIS_CRITERIA.exclusion.hematologic, ...THROMBOLYSIS_CRITERIA.exclusion.imaging].map((c) => (<label key={c.id} className="flex flex-col cursor-pointer p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-rose-100 dark:border-rose-900 hover:bg-rose-50/50 transition-colors"><div className="flex items-start"><div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 mr-3 transition-all ${criteriaCheck.has(c.id) ? 'bg-rose-600 border-rose-600 shadow-lg shadow-rose-500/20' : 'border-rose-300'}`}>{criteriaCheck.has(c.id) && <Check className="h-3 w-3 text-white stroke-[4px]" />}</div><input type="checkbox" className="hidden" onChange={() => { const next = new Set(criteriaCheck); if(next.has(c.id)) next.delete(c.id); else next.add(c.id); setCriteriaCheck(next); }} /><span className="text-xs font-black text-rose-950 dark:text-rose-100 leading-tight">{c.text}</span></div>{c.note && <p className="text-[9px] font-bold text-rose-600 mt-2 ml-8 uppercase opacity-60">{c.note}</p>}</label>))}</div></div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/40 rounded-[2rem] p-6 shadow-sm"><h4 className="text-amber-700 dark:text-amber-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Warnings / Relativos</h4><div className="space-y-2">{THROMBOLYSIS_CRITERIA.warnings.map((c) => (<label key={c.id} className="flex flex-col cursor-pointer p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-amber-100 dark:border-amber-900 hover:bg-amber-50/50 transition-colors"><div className="flex items-start"><div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 mr-3 transition-all ${criteriaCheck.has(c.id) ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-emerald-300'}`}>{criteriaCheck.has(c.id) && <Check className="h-3 w-3 text-white stroke-[4px]" />}</div><input type="checkbox" className="hidden" onChange={() => { const next = new Set(criteriaCheck); if(next.has(c.id)) next.delete(c.id); else next.add(c.id); setCriteriaCheck(next); }} /><span className="text-xs font-black text-amber-950 dark:text-amber-100 leading-tight">{c.text}</span></div>{c.note && <p className="text-[9px] font-bold text-amber-600 mt-2 ml-8 uppercase opacity-60 leading-relaxed italic">{c.note}</p>}</label>))}</div></div>
            </div>
        )}
        {protocolStep === 3 && (
            <div className="animate-in fade-in flex flex-col items-center pt-4 w-full">
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2.5rem] p-10 shadow-xl text-center w-full max-w-md border-t-8 border-t-primary">
                    <Syringe className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tighter">Cálculo de Dose</h3>
                    
                    <div className="mb-8 text-left">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2.5 block ml-2">Escolha o Agente</label>
                        <div className="flex bg-slate-100 dark:bg-black p-1 rounded-2xl mb-4">
                            <button onClick={() => setThrombolyticAgent('tenecteplase')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${thrombolyticAgent === 'tenecteplase' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Tenecteplase</button>
                            <button onClick={() => setThrombolyticAgent('alteplase')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${thrombolyticAgent === 'alteplase' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-slate-500'}`}>Alteplase</button>
                        </div>

                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2.5 block ml-2">Peso do Paciente (kg)</label>
                        <input type="number" value={patientWeight} onChange={e => setPatientWeight(e.target.value)} placeholder="00.0" className="w-full text-center text-4xl font-black bg-slate-50 dark:bg-black border-2 border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-inner outline-none focus:border-primary" />
                    </div>

                    {calculateDosage() && (
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-950 text-white rounded-3xl shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Dose Total ({calculateDosage()?.drug})</span>
                                <div className="text-5xl font-black mt-2 tracking-tighter">{calculateDosage()?.total}<span className="text-xl ml-1 text-emerald-400">mg</span></div>
                                <p className="text-[8px] mt-2 opacity-50 uppercase tracking-widest">Máximo: {calculateDosage()?.max} mg</p>
                            </div>
                            
                            {thrombolyticAgent === 'alteplase' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 shadow-sm">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bolus (10%)</span>
                                        <div className="text-xl font-black text-primary">{calculateDosage()?.bolus} mg</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 shadow-sm">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Infusão 60' (90%)</span>
                                        <div className="text-xl font-black text-primary">{calculateDosage()?.infusion} mg</div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Administração Única</p>
                                        <p className="text-xs font-bold mt-1">Bolus IV em 5-10 segundos.</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mt-2">
                                         <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                            <AlertTriangle className="h-3 w-3" /> Atenção Pediátrica
                                         </p>
                                         <p className="text-[9px] text-slate-600 dark:text-slate-300 mt-1 leading-tight">
                                            Para crianças (&lt;18 anos), a Alteplase permanece a droga de escolha (Nível 2b). Segurança da TNK em pediatria é incerta.
                                         </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )}
        {protocolStep === 4 && (
            <div className="space-y-6 animate-in fade-in w-full pb-20">
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Shield className="h-10 w-10 opacity-40" />
                    <div>
                        <h3 className="font-black uppercase tracking-tight text-lg">Cuidados Pós-Trombólise</h3>
                        <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Protocolo de Monitorização 24h</p>
                    </div>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-100 dark:border-rose-900/40 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-rose-700 dark:text-rose-400 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2"><AlertOctagon className="h-4 w-4" /> Alvo de Pressão Arterial</h4>
                    <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-rose-200 dark:border-rose-800 mb-4 text-center">
                        <p className="text-2xl font-black text-rose-600 tracking-tighter">{POST_THROMBOLYSIS_CARE.bp_goals.target}</p>
                    </div>
                    <ul className="space-y-2">
                        {POST_THROMBOLYSIS_CARE.bp_goals.measures.map((m, i) => (
                            <li key={i} className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></span>
                                {m}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Monitorização Clínica</h4>
                        <div className="space-y-4">
                            {POST_THROMBOLYSIS_CARE.monitoring.map((m, i) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                                    <p className="text-[9px] font-black text-primary uppercase">{m.time}</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white mt-1">{m.frequency}</p>
                                    <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tight">{m.activities.join(' • ')}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" /> Cuidados Gerais</h4>
                        <div className="space-y-3">
                            {POST_THROMBOLYSIS_CARE.general_care.map((c, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="h-6 w-6 bg-slate-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                                        <Check className="h-3 w-3 text-emerald-500 stroke-[4]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.title}</p>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight">{c.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/40 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-amber-700 dark:text-amber-400 font-black uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Manejo de Complicações</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {POST_THROMBOLYSIS_CARE.complications.map((c, i) => (
                            <div key={i} className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-amber-200 dark:border-zinc-800">
                                <p className="text-[10px] font-black text-amber-600 uppercase mb-1">{c.title}</p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{c.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Protocolos de Retorno da Anticoagulação & Antiagregação */}
                <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-900 pb-4">
                        <div>
                            <h4 className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                <Stethoscope className="h-5 w-5 text-primary animate-pulse" /> Retorno da Anticoagulação e Antiagregação
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Baseado nos estudos ELAN, CATALYST e AHA Guideline</p>
                        </div>
                        <div className="flex items-center gap-1.5 self-start sm:self-center">
                            <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded">Cardioembólico: ELAN / Catalyst</span>
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-500 px-2 py-1 rounded">Outros: AHA</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CARDIOEMBOLIC SECTION */}
                        <div className="flex flex-col h-full">
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5 mb-2">
                                        <CheckCircle2 className="h-4 w-4" /> 1. AVC Cardioembólico (Estudos ELAN & CATALYST)
                                    </h5>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Evidências robustas suportam o início ou reintrodução precoce de DOAC (<span className="font-extrabold text-slate-900 dark:text-white">≤ 4 dias</span> na maioria dos casos) no AVC leve a moderado por Fibrilação Atrial, reduzindo re-infarto sem elevar sangramentos ativos.
                                    </p>

                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tempo Ótimo de Início (DOAC no Estudo ELAN):</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* AVC Menor */}
                                            <div 
                                                className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between cursor-zoom-in hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all hover:scale-[1.02] duration-200 group/minor"
                                                onClick={() => setFullscreenImage('https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/elan/minor_final.png')}
                                            >
                                                <div className="space-y-0.5">
                                                    <span className="text-[8px] font-black uppercase text-emerald-600 block">AVC Menor</span>
                                                    <span className="text-[9px] text-slate-400 font-bold leading-tight block">Infarto ≤ 1.5 cm</span>
                                                </div>
                                                <div className="mt-2.5 space-y-2">
                                                    <div className="h-14 bg-slate-50 dark:bg-black/30 rounded-lg overflow-hidden flex items-center justify-center p-0.5 border border-slate-100 dark:border-zinc-800/80">
                                                        <img 
                                                            src="https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/elan/minor_final.png" 
                                                            alt="AVC Menor" 
                                                            className="max-h-full max-w-full object-contain group-hover/minor:scale-105 transition-transform duration-200"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-950/40 text-center px-1 py-0.5 rounded block">≤ 48 horas</span>
                                                </div>
                                            </div>

                                            {/* AVC Moderado */}
                                            <div 
                                                className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between cursor-zoom-in hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all hover:scale-[1.02] duration-200 group/mod"
                                                onClick={() => setFullscreenImage('https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/elan/moderate_final_2.png')}
                                            >
                                                <div className="space-y-0.5">
                                                    <span className="text-[8px] font-black uppercase text-emerald-600 block">AVC Moderado</span>
                                                    <span className="text-[9px] text-slate-400 font-bold leading-tight block">Cortical superficial</span>
                                                </div>
                                                <div className="mt-2.5 space-y-2">
                                                    <div className="h-14 bg-slate-50 dark:bg-black/30 rounded-lg overflow-hidden flex items-center justify-center p-0.5 border border-slate-100 dark:border-zinc-800/80">
                                                        <img 
                                                            src="https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/elan/moderate_final_2.png" 
                                                            alt="AVC Moderado" 
                                                            className="max-h-full max-w-full object-contain group-hover/mod:scale-105 transition-transform duration-200"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-950/40 text-center px-1 py-0.5 rounded block">≤ 48 horas</span>
                                                </div>
                                            </div>

                                            {/* AVC Maior */}
                                            <div 
                                                className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between cursor-zoom-in hover:border-purple-500/40 dark:hover:border-purple-500/30 transition-all hover:scale-[1.02] duration-200 group/major"
                                                onClick={() => setFullscreenImage('https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/elan/major_final_2.png')}
                                            >
                                                <div className="space-y-0.5">
                                                    <span className="text-[8px] font-black uppercase text-purple-600 block">AVC Maior</span>
                                                    <span className="text-[9px] text-slate-400 font-bold leading-tight block">Extenso / Tronco</span>
                                                </div>
                                                <div className="mt-2.5 space-y-2">
                                                    <div className="h-14 bg-slate-50 dark:bg-black/30 rounded-lg overflow-hidden flex items-center justify-center p-0.5 border border-slate-100 dark:border-zinc-800/80">
                                                        <img 
                                                            src="https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/ferramentas/elan/major_final_2.png" 
                                                            alt="AVC Maior" 
                                                            className="max-h-full max-w-full object-contain group-hover/major:scale-105 transition-transform duration-200"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-950/40 text-center px-1 py-0.5 rounded block session-tag">Dia 6 ou 7</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                                        <span className="font-black text-slate-700 dark:text-slate-300">Estudo CATALYST (Lancet 2025):</span> Meta-análise IPD de 5.441 pacientes confirmou que o início precoce (≤ 4 dias) reduziu o desfecho composto (recorrência de AVC ou sICH em 30 dias) de forma expressiva (OR 0.70; p=0.039) e sem aumento de hemorrágicos relevantes.
                                    </div>
                                </div>

                                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-900/60">
                                    <div>
                                        <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">👍 Indicações de Início Precoce:</p>
                                        <ul className="list-disc list-inside text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 leading-tight">
                                           <li>Doença cardioembólica estabelecida (FA, trombo atrial).</li>
                                           <li>Infartos pequenos ou médios sem sangramento prévio.</li>
                                           <li>Pressão controlada nas últimas 24 horas.</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">⚠️ Contraindicações / Postergamento (Postergar até estabilizar):</p>
                                        <ul className="list-disc list-inside text-[10px] text-slate-600 dark:text-slate-400 space-y-0.5 leading-tight">
                                           <li>Transformação Hemorrágica do Infarto tipo PH-2 (massa ativa).</li>
                                           <li>NIHSS inicial extremamente alto (&gt;20) ou lesão massiva.</li>
                                           <li>Instabilidade hemodinâmica ou PAS persistentemente elevada.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* OUTROS AVCS (NON-CARDIOEMBOLIC) SECTION & IMAGE CONSULTATION */}
                        <div className="flex flex-col h-full">
                            <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5 mb-2">
                                        <Info className="h-4 w-4 text-primary" /> 2. Outros AVCs (AHA/ASA Stroke Guideline)
                                    </h5>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Casos de AVC não-cardioembólico (lacunares, grandes artérias, criptogênicos) priorizam antiagregação e profilaxia de estase venosa rápida.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-wider">💊 Retorno / Início do AAS (Aspirina):</p>
                                            <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                                                Iniciar AAS (100mg a 325mg/dia) nas primeiras <span className="font-extrabold text-slate-900 dark:text-white">24 a 48 horas</span> do início dos sintomas.
                                            </p>
                                            <div className="mt-1.5 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                                🚫 SE SUBMETIDO A TROMBÓLISE/TROMBECTOMIA: Aguardar rigorosamente <span className="font-black">24 horas</span> e realizar TC de Crânio de controle sem sangramento antes de introduzir o AAS.
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-800">
                                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">⚓ Retorno / Início de Anticoagulação Profilática (TVP):</p>
                                            <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                                                Iniciar para pacientes de mobilidade reduzida com Enoxaparina (40mg SC 1x/dia) ou Heparina profilática de <span className="font-extrabold text-slate-900 dark:text-white">24 a 48 horas</span> do início do AVC.
                                            </p>
                                            <div className="mt-1.5 p-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                                🚫 SE SUBMETIDO A TROMBÓLISE/TROMBECTOMIA: Aguardar obrigatoriamente <span className="font-black">24 horas</span> após o término do procedimento antes de iniciar Heparina profilática.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Investigação Etiológica (Classificação de TOAST) */}
                <div className="bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/40 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-indigo-700 dark:text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                        <FileBarChart className="h-4 w-4" /> Investigação de AVC / TOAST (Solicitações recomendadas)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 font-medium">
                            <span className="text-[9px] font-black uppercase text-indigo-600 block mb-2 tracking-wider">🔬 Exames Laboratoriais (Sempre)</span>
                            <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Hemograma completo</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Função renal (Ureia, Creatinina)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Lipidograma (CT, LDL, HDL, TG)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Sorologia para Sífilis (VDRL)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Hemoglobina Glicada (HbA1c)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Coagulograma (TAP/RNI e TTPA)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Eletrólitos (Na, K, Mg, Ca)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Marcadores Cardíacos (Troponina)</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 font-medium col-span-1">
                            <span className="text-[9px] font-black uppercase text-indigo-600 block mb-2 tracking-wider">💓 Avaliação Cardíaca (Sempre)</span>
                            <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                                <li className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>ECG (Eletrocardiograma) - Sempre</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Holter de 24h (se FA paroxística)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Ecocardiograma Transtorácico/Transesofágico</li>
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 font-medium">
                            <span className="text-[9px] font-black uppercase text-indigo-600 block mb-2 tracking-wider">🧠 Exames de Imagem (Sob Indicação)</span>
                            <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300">
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Angiotomografia Arterial (Cranio/Pescoço)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Ressonância Magnética (Encéfalo)</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Doppler de Carótidas e Vertebrais</li>
                                <li className="flex items-center gap-1.5"><span className="w-1 h-1 bg-indigo-500 rounded-full shrink-0"></span>Doppler Transcraniano</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )}
        {protocolStep === 5 && (
            <div className="space-y-6 animate-in fade-in w-full pb-20">
                <div className="bg-purple-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4">
                    <Anchor className="h-10 w-10 opacity-40" />
                    <div><h3 className="font-black uppercase tracking-tight text-lg">Trombectomia Mecânica (EVT)</h3><p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Critérios Estendidos 2026</p></div>
                </div>

                <div className="space-y-4">
                    {EVT_CRITERIA.map((criteria, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-950 border-2 border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-sm font-black uppercase text-primary tracking-widest">{criteria.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{criteria.subtitle}</p>
                                </div>
                                <div className="bg-slate-100 dark:bg-zinc-900 p-2 rounded-xl">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>
                            <ul className="space-y-2 mb-4">
                                {criteria.criteria.map((c, i) => (
                                    <li key={i} className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0"></span>
                                        {c}
                                    </li>
                                ))}
                            </ul>
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">Conduta: {criteria.action}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-[2rem] border border-slate-200 dark:border-zinc-800">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-2"><Activity className="h-3 w-3" /> Metas de Pressão Arterial (EVT)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-100 dark:border-zinc-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Antes/Durante</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">PAS ≤ 180 mmHg</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-black rounded-xl border border-slate-100 dark:border-zinc-800">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Pós-Reperfusão (TICI 2b/3)</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">Evitar PAS {"<"} 140 mmHg (72h)</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-900 flex items-center justify-between z-[170] shadow-2xl">
            <div className="flex items-center gap-4"><div className="hidden sm:block"><p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Status do Protocolo</p><p className="text-3xl font-black text-primary tracking-tighter">{protocolStep === 1 ? (activeSubModule === 'aspects' ? aspectsScore : pcAspectsScore) : nihssScore}</p></div></div>
            <div className="flex gap-2"><button onClick={() => navigator.clipboard.writeText(generateReport())} className="px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest bg-slate-100 dark:bg-zinc-900 text-slate-500 flex items-center transition-colors hover:text-primary"><Copy className="h-4 w-4 mr-2" /> Relatório</button>{protocolStep < 5 ? (<button onClick={() => setProtocolStep(p => p + 1)} className="bg-primary text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center transition-all active:scale-95">Avançar <ChevronRight className="h-4 w-4 ml-2" /></button>) : (<button onClick={handleFinishThrombolysis} className="bg-slate-950 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-black/30 flex items-center active:scale-95 transition-all">Encerrar Caso</button>)}</div>
        </div>
    </div>
  );

  // --- LOGIC GENERIC TOOLS ---
  const renderGenericTool = (tool: CalcTool) => {
      const toolScore = tool.questions.reduce((acc, q) => acc + (scores[q.id] || 0), 0);
      const interp = tool.interpretation(toolScore);
      
      const copyReport = () => {
          const detail = tool.questions.map(q => `${q.id}: ${scores[q.id] || 0}`).join(', ');
          navigator.clipboard.writeText(`${tool.name}\nScore: ${toolScore}\nInterp: ${interp.text}\n(${detail})`);
          alert("Copiado!");
      };

      return (
          <div className="space-y-6 pb-40 w-full">
              <div className={`bg-white dark:bg-zinc-950 border-2 border-slate-100 dark:border-zinc-900 p-6 rounded-[2rem] flex justify-between items-center shadow-sm w-full ${tool.bg ? tool.bg.replace('bg-', 'border-') : ''}`}>
                  <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-lg ${tool.bg || 'bg-primary'} ${tool.color ? tool.color.replace('text-', 'text-white') : 'text-white'}`}><tool.icon className="h-6 w-6" /></div>
                      <div><h4 className={`font-black text-base uppercase tracking-tight leading-none ${tool.color || 'text-primary'}`}>Resultado</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{tool.name}</p></div>
                  </div>
                  <div className="text-right">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{toolScore}</span>
                      <div className={`text-[8px] font-black px-2 py-0.5 rounded uppercase mt-1 ${interp.color} ${interp.bg}`}>{interp.text}</div>
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-3 w-full">
                  {tool.questions.map((q) => (
                      <div key={q.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm w-full">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{q.text}</h4>
                          {q.type === 'radio' ? (
                              <div className="grid grid-cols-1 gap-2">
                                  {q.options.map((opt: any) => (
                                      <button key={opt.label} onClick={() => setScores(p => ({...p, [q.id]: opt.value}))} className={`text-left p-3 rounded-xl text-[10px] font-black border transition-all ${scores[q.id] === opt.value ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800'}`}>{opt.label}</button>
                                  ))}
                              </div>
                          ) : (
                              <div className="flex flex-wrap gap-2">
                                  {q.options.map((opt: any) => (
                                      <button key={opt.label} onClick={() => setScores(p => ({...p, [q.id]: opt.value}))} className={`flex-1 min-w-[120px] p-3 rounded-xl text-[10px] font-black border transition-all ${scores[q.id] === opt.value ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-800'}`}>{opt.label}</button>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))}
              </div>
              <div className="fixed bottom-0 left-0 w-full p-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-zinc-800 flex justify-end gap-2 z-50 shadow-2xl">
                  <button onClick={copyReport} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-zinc-900 text-slate-500 hover:text-primary">Copiar</button>
                  <button onClick={() => setActiveToolId(null)} className="bg-slate-950 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Fechar</button>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col">
      {fullscreenImage && (
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white p-2"><X className="h-10 w-10" /></button>
          <img src={fullscreenImage} alt="Fullscreen View" className="max-w-full max-h-full object-contain shadow-2xl" />
        </div>
      )}
      <header className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-900 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4"><button onClick={() => activeToolId ? setActiveToolId(null) : navigate(user ? '/' : '/login')} className="p-2 text-slate-400 hover:text-primary"><ArrowLeft className="h-5 w-5" /></button><h1 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Neurovascular</h1></div>
      </header>
      <main className="flex-1 w-full p-4 md:p-6">
        
        {!activeToolId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <button onClick={() => { setActiveToolId('thrombolysis'); setScores({}); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group w-full">
                    <div className="p-3 bg-rose-500/10 rounded-2xl w-fit mb-4 text-rose-500"><Syringe className="h-6 w-6" /></div>
                    <h3 className="font-black text-lg mb-1">Protocolo de AVC (2026)</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Trombólise (TNK) & Trombectomia</p>
                </button>
                {NEW_TOOLS.map(tool => (
                    <button key={tool.id} onClick={() => { setActiveToolId(tool.id); setScores({}); }} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-900 rounded-3xl shadow-sm hover:border-primary transition-all text-left group w-full">
                        <div className={`p-3 rounded-2xl w-fit mb-4 ${tool.bg || 'bg-slate-100 dark:bg-zinc-800'} ${tool.color || 'text-slate-400'} group-hover:text-primary transition-colors`}><tool.icon className="h-6 w-6" /></div>
                        <h3 className="font-black text-lg mb-1">{tool.name}</h3>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{tool.description}</p>
                    </button>
                ))}
            </div>
        ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-zinc-800 relative w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black uppercase tracking-tight">{activeToolId === 'thrombolysis' ? 'Protocolo de AVC Agudo (2026)' : NEW_TOOLS.find(t => t.id === activeToolId)?.name || 'Ferramenta'}</h2>
                    <button onClick={() => setActiveToolId(null)} className="text-slate-400 hover:text-primary"><ArrowLeft className="h-5 w-5" /></button>
                </div>
                {activeToolId === 'thrombolysis' ? renderThrombolysis() : (NEW_TOOLS.find(t => t.id === activeToolId) ? renderGenericTool(NEW_TOOLS.find(t => t.id === activeToolId)!) : <div className="p-10 text-center text-slate-500 font-bold">Ferramenta não encontrada</div>)}
            </div>
        )}
      </main>
    </div>
  );
};
