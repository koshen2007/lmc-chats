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
      className="absolute bottom-full left-0 right-0 mb-2 z-50 max-h-56 sm:max-h-72 overflow-y-auto scroll rounded-xl bg-[#111622]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-1.5"
    >
      <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-white/[0.06] text-[11px] font-medium text-[#8A94A6]">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Slash Commands</span>
        </div>
        <span className="text-[#6C7689]">Tab / Enter to select • Esc to dismiss</span>
      </div>

      <div className="space-y-0.5">
        {commands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.command}
              data-index={idx}
              type="button"
              onClick={() => onSelectCommand(cmd)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isSelected
                  ? 'bg-indigo-500/15 border border-indigo-500/30 text-white'
                  : 'hover:bg-white/[0.04] text-[#A6B0C3] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-500/20' : 'bg-white/[0.04]'
                  }`}
                >
                  {renderIcon(cmd.icon)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-indigo-300 font-mono">
                      {cmd.command}
                    </span>
                    <span className="text-xs text-[#6C7689] font-mono hidden sm:inline">
                      {cmd.syntax.replace(cmd.command, '').trim()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A94A6] truncate">{cmd.description}</p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#A6B0C3]">
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

