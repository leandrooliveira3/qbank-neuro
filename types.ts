
export type Difficulty = 'Fácil' | 'Médio' | 'Difícil';
export type Priority = 'Baixa' | 'Média' | 'Alta';
export type TaskStatus = 'Pendente' | 'Em Progresso' | 'Concluída';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  specialty?: string;
  xp?: number;
  level?: number;
  rank?: string;
  last_daily_bonus?: string; 
  streak_count?: number; 
  achievements?: string[]; 
  created_at: string;
  srs_profile?: string;
  daily_limit?: number;
  priority_config?: any;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string;
  deadline: string;
  progress: number;
  created_at?: string;
  updated_at?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  subject: string;
  duration_minutes: number;
  type: 'Pomodoro' | 'Free';
  date: string;
  created_at?: string;
}

export interface Question {
  id: string;
  bank_name?: string;
  category: string;
  subcategory?: string;
  difficulty: Difficulty;
  statement: string;
  alternatives: {
    id: string;
    text: string;
    is_correct: boolean;
  }[];
  explanation: string;
  statement_image_url?: string;
  statement_image_urls?: string[];
  explanation_image_url?: string;
  tags: string[];
  reference?: string;
  created_at: string;
  updated_at?: string;
  created_by: string;
}


export interface Occlusion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Flashcard {
  id: string;
  user_id: string;
  bank_name?: string;
  front: string;
  back: string;
  front_image_url?: string;
  back_image_url?: string;
  image_position?: 'front' | 'back' | 'both';
  occlusions?: Occlusion[];
  category?: string;
  status: 'new' | 'learning' | 'review' | 'mastered' | 'inactive';
  next_review: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  last_review?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlanEvent {
    id: string;
    user_id: string;
    title: string;
    date: string;
    type: 'study' | 'exam' | 'review';
    completed: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AIImportedQuestion {
  categoria: string;
  subcategoria: string;
  enunciado: string;
  alternativas: string[];
  gabarito: string;
  comentario: string;
  dificuldade: string;
  tags: string[];
  fonte?: string;
  imagem?: string;
  coordenadas_imagem?: number[];
  analise_radiologica?: string;
  indice_imagem_referencia?: number;
  indice_imagem_associada?: number;
  coordenadas_recorte?: number[];
  suporte_texto?: string; 
  visual_element_id?: string;
  legenda_imagem?: string; // Novo Campo
  _tempFile?: File;
  _tempFiles?: File[];
  _tempUrl?: string;
  _tempUrls?: string[];
}

export interface DashboardStats {
  totalQuestions: number;
  totalCategories: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface Summary {
  id: string;
  user_id: string;
  bank_name?: string;
  title: string;
  category: string;
  content: string;
  attachment_url?: string;
  attachment_type?: 'image' | 'pdf' | 'doc'; 
  last_edited: string;
  updated_at?: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  duration_seconds: number;
  bank_name: string;
  category: string;
  tags?: string[];
  created_at: string;
  drive_path?: string;
  drive_file_id?: string;
  mime_type?: string;
  size_bytes?: number;
}

export interface DidacticMaterial {
  id: string;
  title: string;
  description?: string;
  download_url: string;
  mime_type: string;
  size_bytes: number;
  drive_path: string;
  drive_file_id: string;
  created_at: string;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  progress_seconds: number;
  completed: boolean;
  last_watched: string;
}

export interface VideoMaterial {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  type: 'link' | 'note';
  title: string;
  content: string;
  created_at: string;
}

export interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  parent_id?: string | null; 
  likes: number;
  created_at: string;
}

export interface LMEData {
  patientName: string;
  patientMotherName: string;
  patientWeight?: string;
  patientHeight?: string;
  professionalName: string;
  professionalCNS: string;
  date: string;
  medicationName: string;
  quantities: [string, string, string, string, string, string];
  hasCapacityAttestation: boolean;
  responsibleName?: string;
  cid10?: string;
  anamnesis?: string; 
  clinicalHistory?: string; 
  previousTreatments?: string; 
  currentTreatment?: string; 
}

export interface AIExtractedLME {
  cid10: string;
  anamnese_lme: string;
  historia_clinica: string;
  tratamentos_previos: string;
  tratamento_atual: string;
}