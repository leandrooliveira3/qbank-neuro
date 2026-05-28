
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { 
  User, Calendar, FileText, Download, Sparkles, Loader2, 
  ArrowLeft, CheckCircle2, Copy, Printer, Activity,
  Stethoscope, Pill, ScrollText, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { extractLmeData } from '../../services/ai';
import { LMEData } from '../../types';
import { supabase } from '../../services/supabase';
import download from 'downloadjs';

const PROTOCOLS = [
  { id: 'epilepsia', name: 'Epilepsia', cid: 'G40', color: 'bg-purple-500', border: 'border-purple-500' },
  { id: 'parkinson', name: 'Parkinson', cid: 'G20', color: 'bg-blue-500', border: 'border-blue-500' },
  { id: 'alzheimer', name: 'Alzheimer', cid: 'G30', color: 'bg-rose-500', border: 'border-rose-500' },
  { id: 'esclerose', name: 'Esclerose Múltipla', cid: 'G35', color: 'bg-orange-500', border: 'border-orange-500' },
  { id: 'miastenia', name: 'Miastenia Gravis', cid: 'G70', color: 'bg-emerald-500', border: 'border-emerald-500' }
];

export const BureaucracyTool: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [selectedProtocol, setSelectedProtocol] = useState(PROTOCOLS[0]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Data State
  const [formData, setFormData] = useState<LMEData>({
      patientName: '',
      patientMotherName: '',
      patientWeight: '',
      patientHeight: '',
      professionalName: '',
      professionalCNS: '',
      date: new Date().toLocaleDateString('pt-BR'),
      medicationName: '',
      quantities: ['', '', '', '', '', ''],
      hasCapacityAttestation: false,
      cid10: '',
      anamnesis: '',
      clinicalHistory: '',
      previousTreatments: '',
      currentTreatment: ''
  });
  
  const [medicalRecord, setMedicalRecord] = useState('');

  useEffect(() => {
      if (user) {
          setFormData(prev => ({
              ...prev,
              professionalName: user.full_name || '',
              // Tentar recuperar CNS do perfil se existir (ou adicionar campo no perfil depois)
          }));
      }
  }, [user?.id]);

  const handleAIAnalysis = async () => {
      if (!medicalRecord.trim()) return;
      setAnalyzing(true);
      try {
          const result = await extractLmeData(medicalRecord, selectedProtocol.name);
          setFormData(prev => ({
              ...prev,
              cid10: result.cid10 || selectedProtocol.cid,
              anamnesis: result.anamnese_lme,
              clinicalHistory: result.historia_clinica,
              previousTreatments: result.tratamentos_previos,
              currentTreatment: result.tratamento_atual
          }));
      } catch (e) {
          alert("Erro na análise IA. Tente novamente.");
      } finally {
          setAnalyzing(false);
      }
  };

  const handleGenerate = async () => {
      if (!formData.patientName || !formData.medicationName) {
          alert("Preencha ao menos Nome do Paciente e Medicamento.");
          return;
      }
      setLoading(true);
      try {
          // URL do Template PDF no Storage (Deve ser um PDF Preenchível/AcroForm)
          const pdfUrl = `https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/documentos/templates_acroform/${selectedProtocol.id}_form.pdf`;
          
          // Prepara payload flattening quantities
          const payload = {
              ...formData,
              qtd_1: formData.quantities[0],
              qtd_2: formData.quantities[1],
              qtd_3: formData.quantities[2],
              qtd_4: formData.quantities[3],
              qtd_5: formData.quantities[4],
              qtd_6: formData.quantities[5],
          };

          const { data, error } = await supabase.functions.invoke('python-lme', {
              body: { pdfUrl, formData: payload }
          });

          if (error) throw error;
          if (data?.pdfBase64) {
              download(`data:application/pdf;base64,${data.pdfBase64}`, `LME_${formData.patientName}.pdf`, "application/pdf");
          } else {
              throw new Error("PDF não retornado.");
          }

      } catch (e: any) {
          console.error(e);
          alert("Erro ao gerar PDF: " + (e.message || "Verifique se o template existe no Storage."));
      } finally {
          setLoading(false);
      }
  };

  const updateQuantity = (idx: number, val: string) => {
      const newQ = [...formData.quantities];
      newQ[idx] = val;
      setFormData({...formData, quantities: newQ as any});
  };

  const replicateQuantity = () => {
      const val = formData.quantities[0];
      setFormData({...formData, quantities: [val, val, val, val, val, val]});
  };

  return (
    <Layout title="Emissor LME Inteligente" fullWidth>
      <div className="h-full flex flex-col bg-slate-50 dark:bg-black overflow-hidden">
        
        {/* HEADER / NAV */}
        <header className="px-6 py-4 border-b border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl transition-all text-slate-400 hover:text-primary"><ArrowLeft className="h-5 w-5" /></button>
                <div>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Burocracia Zero</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automação de Processos de Alto Custo</p>
                </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${step === s ? 'bg-white dark:bg-black shadow-sm text-primary' : 'text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${step === s ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-zinc-800 text-slate-500'}`}>{s}</span>
                        <span className="hidden md:inline">{s === 1 ? 'Protocolo' : s === 2 ? 'Dados' : 'Revisão'}</span>
                    </div>
                ))}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* STEP 1: PROTOCOL SELECTION */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Selecione o Protocolo Clínico</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PROTOCOLS.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => { setSelectedProtocol(p); setStep(2); }}
                                    className={`relative p-6 rounded-[2rem] border-2 text-left transition-all hover:scale-[1.02] group ${selectedProtocol.id === p.id ? `${p.border} bg-white dark:bg-zinc-900 shadow-xl` : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-slate-300'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${p.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{p.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 mt-1">CID-10: {p.cid}</p>
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowLeft className="h-5 w-5 rotate-180 text-slate-300" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: DATA INPUT */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 space-y-6">
                        
                        {/* AI IMPORTER */}
                        <div className="bg-slate-900 dark:bg-zinc-950 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><Sparkles className="h-24 w-24" /></div>
                            <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-400" /> Importar do Prontuário</h3>
                            <div className="flex gap-4 relative z-10">
                                <textarea 
                                    value={medicalRecord}
                                    onChange={e => setMedicalRecord(e.target.value)}
                                    placeholder="Cole a evolução clínica aqui para preenchimento automático..."
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl p-4 text-xs font-medium placeholder:text-white/30 outline-none focus:bg-white/20 transition-all resize-none h-24 custom-scrollbar"
                                />
                                <button 
                                    onClick={handleAIAnalysis}
                                    disabled={analyzing || !medicalRecord}
                                    className="bg-white text-slate-900 w-32 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50 flex flex-col items-center justify-center gap-2"
                                >
                                    {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScrollText className="h-5 w-5" />}
                                    {analyzing ? 'Analisando...' : 'Extrair Dados'}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* PATIENT INFO */}
                            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 space-y-4 shadow-sm">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-2 flex items-center gap-2"><User className="h-4 w-4" /> Identificação</h4>
                                <div className="space-y-3">
                                    <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Nome Paciente</label><input value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" /></div>
                                    <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Nome da Mãe</label><input value={formData.patientMotherName} onChange={e => setFormData({...formData, patientMotherName: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" /></div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Peso (kg)</label><input type="number" value={formData.patientWeight} onChange={e => setFormData({...formData, patientWeight: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary text-center" /></div>
                                        <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Altura (cm)</label><input type="number" value={formData.patientHeight} onChange={e => setFormData({...formData, patientHeight: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary text-center" /></div>
                                    </div>
                                </div>
                            </div>

                            {/* TREATMENT INFO */}
                            <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 space-y-4 shadow-sm">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-2 flex items-center gap-2"><Pill className="h-4 w-4" /> Prescrição</h4>
                                <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Medicamento e Apresentação</label><input value={formData.medicationName} onChange={e => setFormData({...formData, medicationName: e.target.value})} placeholder="Ex: Lamotrigina 100mg" className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" /></div>
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Quantidades (6 Meses)</label>
                                        <button onClick={replicateQuantity} className="text-[9px] font-black text-primary hover:underline uppercase flex items-center gap-1"><Copy className="h-3 w-3" /> Repetir 1º Mês</button>
                                    </div>
                                    <div className="grid grid-cols-6 gap-2">
                                        {formData.quantities.map((q, i) => (
                                            <input key={i} value={q} onChange={e => updateQuantity(i, e.target.value)} placeholder={`${i+1}º`} className="w-full p-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-center outline-none focus:border-primary" />
                                        ))}
                                    </div>
                                </div>
                                <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">CID-10 Secundário (Opcional)</label><input value={formData.cid10} onChange={e => setFormData({...formData, cid10: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none focus:border-primary" /></div>
                            </div>
                        </div>

                        {/* MEDICAL INFO */}
                        <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-[2rem] p-6 space-y-4 shadow-sm">
                            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-zinc-900 pb-2 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Dados Clínicos (Preenchimento Automático)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Anamnese (LME)</label><textarea rows={3} value={formData.anamnesis} onChange={e => setFormData({...formData, anamnesis: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium outline-none focus:border-primary resize-none" /></div>
                                <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Tratamentos Prévios</label><textarea rows={3} value={formData.previousTreatments} onChange={e => setFormData({...formData, previousTreatments: e.target.value})} className="w-full p-3 bg-slate-50 dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-medium outline-none focus:border-primary resize-none" /></div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900">Voltar</button>
                            <button onClick={() => setStep(3)} className="bg-primary text-white px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">Revisar e Gerar</button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVIEW & GENERATE */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 max-w-2xl mx-auto text-center space-y-8 pt-10">
                        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/30">
                            <Printer className="h-10 w-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Tudo Pronto!</h2>
                            <p className="text-sm font-medium text-slate-500 mt-2">O documento será gerado com base no template oficial da Farmácia de Minas.</p>
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-left flex gap-3">
                            <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase mb-1">Atenção ao Template</p>
                                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                    O sistema utilizará o template <strong>{selectedProtocol.id}_form.pdf</strong>. Certifique-se de que ele está carregado no Storage do Supabase como um formulário preenchível (AcroForm).
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button onClick={() => setStep(2)} className="px-8 py-3 rounded-xl font-black text-[10px] uppercase border-2 border-slate-200 dark:border-zinc-800 text-slate-500 hover:border-primary hover:text-primary transition-all">Editar Dados</button>
                            <button onClick={handleGenerate} disabled={loading} className="bg-slate-900 dark:bg-white text-white dark:text-black px-12 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {loading ? 'Processando PDF...' : 'Baixar Documento'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </Layout>
  );
};
