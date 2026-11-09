'use client';

import React, { useEffect, useRef } from 'react';
import {
  Flame,
  BarChart2,
  Footprints,
  Lock,
  Dices,
  Music,
  Disc,
  HelpCircle,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { SlashCommandDefinition } from '@/lib/slashBot';

interface SlashCommandMenuProps {
  isOpen: boolean;
  commands: SlashCommandDefinition[];
  selectedIndex: number;
  onSelectCommand: (cmd: SlashCommandDefinition) => void;
  onClose: () => void;
}

export default function SlashCommandMenu({
  isOpen,
  commands,
  selectedIndex,
  onSelectCommand,
  onClose,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const selectedEl = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen || commands.length === 0) return null;

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'Flame':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'BarChart2':
        return <BarChart2 className="w-4 h-4 text-emerald-400" />;
      case 'Footprints':
        return <Footprints className="w-4 h-4 text-amber-400" />;
      case 'Mask':
        return <EyeOff className="w-4 h-4 text-purple-400" />;
      case 'Lock':
        return <Lock className="w-4 h-4 text-blue-400" />;
      case 'Dices':
        return <Dices className="w-4 h-4 text-pink-400" />;
      case 'Music':
        return <Music className="w-4 h-4 text-cyan-400" />;
      case 'Disc':
        return <Disc className="w-4 h-4 text-teal-400" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full left-0 right-0 mb-3 z-50 max-h-72 overflow-y-auto rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/70 shadow-2xl shadow-indigo-950/50 p-2 scrollbar-thin scrollbar-thumb-slate-700"
    >
      <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-slate-800 text-[11px] font-medium text-slate-400">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>LMC Bot Commands</span>
        </div>
        <span className="text-slate-400">Tab / ↵ to choose • Esc to close</span>
      </div>

      <div className="space-y-1">
        {commands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.command}
              data-index={idx}
              type="button"
              onClick={() => onSelectCommand(cmd)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600/30 via-purple-600/25 to-pink-600/20 border border-indigo-500/40 text-white shadow-sm'
                  : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-500/30' : 'bg-slate-800'
                  }`}
                >
                  {renderIcon(cmd.icon)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-indigo-300 font-mono">
                      {cmd.command}
                    </span>
                    <span className="text-xs text-slate-300 font-mono hidden sm:inline">
                      {cmd.syntax.replace(cmd.command, '').trim()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{cmd.description}</p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
                  {cmd.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

