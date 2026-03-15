
import React, { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Questions } from './pages/Questions';
import { AddQuestion } from './pages/AddQuestion';
import { ImportQuestions } from './pages/ImportQuestions'; 
import { PracticeConfig } from './pages/PracticeConfig';
import { PracticeSession } from './pages/PracticeSession';
import { CreateSimulation } from './pages/CreateSimulation';
import { SimulationSession } from './pages/SimulationSession';
import { SimulationsList } from './pages/SimulationsList'; 
import { Stats } from './pages/Stats';
import { Analysis } from './pages/Analysis'; 
import { Favorites } from './pages/Favorites';
import { Summaries } from './pages/Summaries';
import { Flashcards } from './pages/Flashcards';
import { StudyFlashcards } from './pages/StudyFlashcards';
import { ImportFlashcards } from './pages/ImportFlashcards';
import { Settings } from './pages/Settings';
import { Chat } from './pages/Chat';
import { Revision } from './pages/Revision';
import { Tasks } from './pages/Tasks';
import { Focus } from './pages/Focus';
import { Planning } from './pages/Planning';
import { Comunidade } from './pages/Comunidade';
import { Videos } from './pages/Videos'; 
import { ResidenciaPage } from './pages/ResidenciaPage';

import { NeurovascularTool } from './pages/tools/Neurovascular';
import { NeuroEmergencyTool } from './pages/tools/NeuroEmergency';
import { NeuroCognitionTool } from './pages/tools/NeuroCognition';
import { MovementDisordersTool } from './pages/tools/MovementDisorders';
import { EpilepsyTool } from './pages/tools/Epilepsy';
import { NeuroImmunologyTool } from './pages/tools/NeuroImmunology';
import { NeuromuscularTool } from './pages/tools/Neuromuscular';
import { HeadacheTool } from './pages/tools/Headache';
import { NeuroOphthalmologyTool } from './pages/tools/NeuroOphthalmology';
import { NeuroTraumaTool } from './pages/tools/NeuroTrauma';
import { NeuroInfectologiaTool } from './pages/tools/NeuroInfectologia';
import { NeuroSonologiaTool } from './pages/tools/NeuroSonologia';
import { BureaucracyTool } from './pages/tools/BureaucracyTool';

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading, initialized } = useAuthStore();
  const location = useLocation();
  if (loading || !initialized) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user, loading, initialized } = useAuthStore();
  if (loading || !initialized) return null;
  
  // Specific check for master admin email or generic admin role
  const isAllowed = user?.email === 'steamleandro@hotmail.com' || user?.role === 'admin';
  
  if (!isAllowed) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  const { checkSession } = useAuthStore();
  const { theme, applyTheme } = useThemeStore();
  useEffect(() => { checkSession(); applyTheme(theme); }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/tools/neurovascular" element={<NeurovascularTool />} />
        <Route path="/tools/emergency" element={<NeuroEmergencyTool />} />
        <Route path="/tools/headache" element={<HeadacheTool />} />
        <Route path="/tools/cognition" element={<NeuroCognitionTool />} />
        <Route path="/tools/movement" element={<MovementDisordersTool />} />
        <Route path="/tools/epilepsy" element={<EpilepsyTool />} />
        <Route path="/tools/immunology" element={<NeuroImmunologyTool />} />
        <Route path="/tools/neuromuscular" element={<NeuromuscularTool />} />
        <Route path="/tools/neuro-ophthalmo" element={<NeuroOphthalmologyTool />} />
        <Route path="/tools/neurotrauma" element={<NeuroTraumaTool />} />
        <Route path="/tools/neuroinfecto" element={<NeuroInfectologiaTool />} />
        <Route path="/tools/neurosono" element={<NeuroSonologiaTool />} />
        <Route path="/tools/bureaucracy" element={<BureaucracyTool />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/questions" element={<PrivateRoute><Questions /></PrivateRoute>} />
        <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/focus" element={<PrivateRoute><Focus /></PrivateRoute>} />
        <Route path="/planning" element={<PrivateRoute><Planning /></PrivateRoute>} />
        <Route path="/revision" element={<PrivateRoute><Revision /></PrivateRoute>} />
        <Route path="/add" element={<PrivateRoute><AddQuestion /></PrivateRoute>} />
        <Route path="/import" element={<PrivateRoute><ImportQuestions /></PrivateRoute>} /> 
        <Route path="/practice" element={<PrivateRoute><PracticeConfig /></PrivateRoute>} />
        <Route path="/practice/session" element={<PrivateRoute><PracticeSession /></PrivateRoute>} />
        <Route path="/simulations" element={<PrivateRoute><SimulationsList /></PrivateRoute>} />
        <Route path="/simulations/create" element={<PrivateRoute><CreateSimulation /></PrivateRoute>} />
        <Route path="/simulations/session" element={<PrivateRoute><SimulationSession /></PrivateRoute>} />
        <Route path="/videos" element={<PrivateRoute><Videos /></PrivateRoute>} /> 
        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
        <Route path="/analysis" element={<PrivateRoute><Analysis /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
        <Route path="/summaries" element={<PrivateRoute><Summaries /></PrivateRoute>} />
        <Route path="/flashcards" element={<PrivateRoute><Flashcards /></PrivateRoute>} />
        <Route path="/flashcards/study" element={<PrivateRoute><StudyFlashcards /></PrivateRoute>} />
        <Route path="/flashcards/import" element={<PrivateRoute><ImportFlashcards /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/community" element={<PrivateRoute><Comunidade /></PrivateRoute>} />
        <Route path="/residencia" element={<AdminRoute><ResidenciaPage /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
