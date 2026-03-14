
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Layers, 
  CalendarClock,
  ClipboardList, 
  BarChart2, 
  Settings,
  CheckSquare,
  Timer,
  Zap,
  Upload,
  Users,
  MonitorPlay,
  Syringe, 
  Skull, 
  Droplets, 
  Waves, 
  Eye, 
  AlertTriangle, 
  Thermometer, 
  Brain, 
  Shield, 
  Dumbbell, 
  Activity,
  Printer
} from 'lucide-react';

export const MENU_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Prática', icon: Zap, path: '/practice' },
  { name: 'Gerar Questões IA', icon: Upload, path: '/import' },
  { name: 'Questões', icon: BookOpen, path: '/questions' },
  { name: 'Resumos', icon: FileText, path: '/summaries' },
  { name: 'Flashcards', icon: Layers, path: '/flashcards' },
  { name: 'Simulados', icon: ClipboardList, path: '/simulations' },
  { name: 'Vídeo Aulas', icon: MonitorPlay, path: '/videos' },
  { name: 'Foco', icon: Timer, path: '/focus' },
  { name: 'Tarefas', icon: CheckSquare, path: '/tasks' },
  { name: 'Planejamento', icon: CalendarClock, path: '/planning' },
  { name: 'Analytics', icon: BarChart2, path: '/stats' },
  { name: 'Comunidade', icon: Users, path: '/community' },
  { name: 'Perfil', icon: Settings, path: '/settings' },
];

const AVATAR_BASE_URL = 'https://azigaziisnjguakkajza.supabase.co/storage/v1/object/public/imagens/avatares/';

// Gera automaticamente a lista de 50 avatares (avatar_1.png até avatar_50.png)
export const ANIME_AVATARS = Array.from({ length: 50 }, (_, i) => ({
  name: `Avatar ${i + 1}`,
  url: `${AVATAR_BASE_URL}avatar_${i + 1}.png`
}));

export const SPECIALTIES = [
  "Neurologia",
  "Clínica Médica",
  "Cardiologia",
  "Neurocirurgia",
  "Pediatria",
  "Ginecologia e Obstetrícia",
  "Cirurgia Geral",
  "Ortopedia e Traumatologia",
  "Psiquiatria",
  "Endocrinologia e Metabologia",
  "Gastroenterologia",
  "Pneumologia",
  "Nefrologia",
  "Dermatologia",
  "Oncologia Clínica"
];

export const TOOLS_CATEGORIES = [
  { id: 'headache', name: 'Cefaleia', desc: 'Red Flags (SNOOP10) e ICHD-3.', icon: Thermometer, path: '/tools/headache', text: 'text-orange-600', bgLight: 'bg-orange-600/10' },
  { id: 'epilepsy', name: 'Epilepsia', desc: 'Crises e Classificação ILAE.', icon: Zap, path: '/tools/epilepsy', text: 'text-yellow-500', bgLight: 'bg-yellow-500/10' },
  { id: 'movement', name: 'Movimento', desc: 'Parkinson e Ataxias.', icon: Activity, path: '/tools/movement', text: 'text-blue-500', bgLight: 'bg-blue-500/10' },
  { id: 'cognition', name: 'Neurocognição', desc: 'MEEM, MoCA e CDR.', icon: Brain, path: '/tools/cognition', text: 'text-purple-500', bgLight: 'bg-purple-500/10' },
  { id: 'neuro-ophthalmo', name: 'Neuroftalmologia', desc: 'Diplopia, BAV e HII.', icon: Eye, path: '/tools/neuro-ophthalmo', text: 'text-cyan-500', bgLight: 'bg-cyan-500/10' },
  { id: 'immunology', name: 'Neuroimunologia', desc: 'EDSS, McDonald e NMOSD 2025.', icon: Shield, path: '/tools/immunology', text: 'text-cyan-500', bgLight: 'bg-cyan-500/10' },
  { id: 'neuroinfecto', name: 'Neuroinfectologia', desc: 'Interpretador de LCR e Meningites.', icon: Droplets, path: '/tools/neuroinfecto', text: 'text-emerald-500', bgLight: 'bg-emerald-500/10' },
  { id: 'emergency', name: 'Neurointensivismo', desc: 'Coma (FOUR/Glasgow), Morte Encefálica.', icon: AlertTriangle, path: '/tools/emergency', text: 'text-amber-500', bgLight: 'bg-amber-500/10' },
  { id: 'neuromuscular', name: 'Neuromuscular', desc: 'MG-ADL e MG-Composite.', icon: Dumbbell, path: '/tools/neuromuscular', text: 'text-lime-500', bgLight: 'bg-lime-500/10' },
  { id: 'neurosono', name: 'Neurossonologia', desc: 'DTC Velocidades e Lindegaard.', icon: Waves, path: '/tools/neurosono', text: 'text-blue-500', bgLight: 'bg-blue-500/10' },
  { id: 'neurotrauma', name: 'Neurotrauma', desc: 'Canadian CT, Marshall e PECARN.', icon: Skull, path: '/tools/neurotrauma', text: 'text-orange-500', bgLight: 'bg-orange-500/10' },
  { id: 'neurovascular', name: 'Neurovascular', desc: 'NIHSS, ASPECTS e rt-PA.', icon: Syringe, path: '/tools/neurovascular', text: 'text-rose-500', bgLight: 'bg-rose-500/10' }
];
