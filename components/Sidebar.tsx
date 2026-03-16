import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, ChevronDown, ChevronRight, Stethoscope, Bot, GraduationCap } from 'lucide-react';
import { MENU_ITEMS, TOOLS_CATEGORIES } from '../constants';
import { useAuthStore } from '../store/useAuthStore';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isToolsOpen, setIsToolsOpen] = useState(location.pathname.startsWith('/tools'));

  const isAdmin = user?.email === 'steamleandro@hotmail.com' || user?.role === 'admin';

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="h-14 shrink-0 border-b border-slate-200 dark:border-zinc-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Neuro Portal</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}

        {/* Tools Accordion */}
        <div className="pt-2">
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              location.pathname.startsWith('/tools')
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bot className="h-4 w-4 shrink-0" />
              <span>Ferramentas</span>
            </div>
            {isToolsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {isToolsOpen && (
            <div className="mt-1 ml-2 space-y-0.5 border-l-2 border-slate-200 dark:border-zinc-800 pl-2">
              {TOOLS_CATEGORIES.map((tool) => (
                <NavLink
                  key={tool.id}
                  to={tool.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? `${tool.bgLight} ${tool.text}`
                        : 'text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-900/50 hover:text-slate-700 dark:hover:text-slate-300'
                    }`
                  }
                >
                  <tool.icon className={`h-3.5 w-3.5 shrink-0 ${tool.text}`} />
                  <span className="truncate">{tool.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-zinc-800">
            <NavLink
              to="/residencia"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`
              }
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Residencia Admin</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-4 border-t border-slate-200 dark:border-zinc-900">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name || 'Avatar'} className="h-9 w-9 rounded-full object-cover shadow-lg border-2 border-primary/20" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white font-black text-xs shadow-lg">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.full_name || 'Usuário'}
            </p>
            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
              {user?.rank || 'Estudante'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
