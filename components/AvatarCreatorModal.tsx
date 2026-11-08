'use client';

import React, { useState } from 'react';
import {
  X,
  Shuffle,
  RotateCcw,
  Check,
  Sparkles,
  Palette,
  Eye,
  Smile,
  Shirt,
  Glasses,
  User,
  Wand2,
} from 'lucide-react';
import {
  AvatarConfig,
  DEFAULT_AVATAR,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
  BACKDROP_OPTIONS,
  PRESET_AVATARS,
  generateRandomAvatar,
  renderAvatarSvgString,
  svgToDataUrl,
} from '@/lib/avatarStudio';

interface AvatarCreatorModalProps {
  initialConfig?: AvatarConfig;
  onSave: (avatarDataUrl: string, config: AvatarConfig) => void;
  onClose: () => void;
}

type TabType = 'skin' | 'hair' | 'eyes' | 'mouth' | 'beard' | 'outfit' | 'gear' | 'backdrop';

export default function AvatarCreatorModal({
  initialConfig,
  onSave,
  onClose,
}: AvatarCreatorModalProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig || DEFAULT_AVATAR);
  const [activeTab, setActiveTab] = useState<TabType>('skin');

  // Live SVG string & Data URL
  const svgMarkup = renderAvatarSvgString(config);
  const dataUrl = svgToDataUrl(svgMarkup);

  const handleRandomize = () => {
    setConfig(generateRandomAvatar());
  };

  const handleReset = () => {
    setConfig(DEFAULT_AVATAR);
  };

  const handleApplyPreset = (presetConfig: AvatarConfig) => {
    setConfig({ ...presetConfig });
  };

  const handleSave = () => {
    onSave(dataUrl, config);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'skin', label: 'Skin & Face', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'hair', label: 'Hair', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'eyes', label: 'Eyes', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'mouth', label: 'Mouth & Lips', icon: <Smile className="w-3.5 h-3.5" /> },
    { id: 'beard', label: 'Beard', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'outfit', label: 'Outfit', icon: <Shirt className="w-3.5 h-3.5" /> },
    { id: 'gear', label: 'Gear & Glasses', icon: <Glasses className="w-3.5 h-3.5" /> },
    { id: 'backdrop', label: 'Backdrop', icon: <Wand2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-msg-in">
      <div className="w-full max-w-2xl bg-[#0F131D] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#131826]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 grid place-items-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Avatar Studio</h2>
              <p className="text-[11px] text-[#7A8396]">Snapchat/Bitmoji style 3D vector avatar builder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto scroll flex flex-col md:flex-row min-h-0">
          {/* Left Column: Live Interactive Preview */}
          <div className="p-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 bg-[#0B0E17]/60 shrink-0 md:w-64">
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity" />

              {/* 160x160 Live Circular Avatar */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl ring-2 ring-white/15 bg-transparent">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: svgMarkup }}
                />
              </div>
            </div>

            {/* Quick Actions (Randomize & Reset) */}
            <div className="flex items-center gap-2 mt-4 w-full">
              <button
                type="button"
                onClick={handleRandomize}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow"
                title="Generate Random Avatar"
              >
                <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Shuffle</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#7A8396] hover:text-white p-2 rounded-xl transition-all active:scale-95"
                title="Reset to Default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="w-full mt-4">
              <p className="text-[10px] font-bold tracking-wider uppercase text-[#7A8396] mb-2 text-center">
                Popular Presets
              </p>
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset.config)}
                    className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 border border-white/5 text-[10px] font-semibold text-[#CBD5E1] truncate text-center transition-colors"
                    title={preset.tag}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Customizer Tabs & Controls */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs Bar */}
            <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto scroll bg-[#111522] shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#8892B0] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            <div className="p-4 sm:p-5 overflow-y-auto scroll flex-1 space-y-5">
              {/* 1. SKIN & FACE */}
              {activeTab === 'skin' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Skin Tone</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {SKIN_TONES.map((tone) => {
                        const isSelected = config.skinColor.toLowerCase() === tone.color.toLowerCase();
                        return (
                          <button
                            key={tone.id}
                            type="button"
                            onClick={() => setConfig({ ...config, skinColor: tone.color })}
                            className={`group relative aspect-square rounded-2xl p-1 border-2 transition-all flex flex-col items-center justify-center ${
                              isSelected
                                ? 'border-indigo-500 scale-105 shadow-md ring-2 ring-indigo-500/50'
                                : 'border-transparent hover:border-white/30'
                            }`}
                            style={{ backgroundColor: tone.color }}
                            title={tone.name}
                          >
                            {isSelected && <Check className="w-4 h-4 text-black/70 drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Face Shape</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'oval', label: 'Classic Oval' },
                        { id: 'round', label: 'Cute Round' },
                        { id: 'square', label: 'Defined Jaw' },
                        { id: 'chiseled', label: 'Chiseled' },
                      ].map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => setConfig({ ...config, headShape: shape.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.headShape === shape.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Nose Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'button', label: 'Cute Button' },
                        { id: 'straight', label: 'Straight Bridge' },
                        { id: 'wide', label: 'Soft Wide' },
                      ].map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setConfig({ ...config, nose: n.id as any })}
                          className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.nose === n.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. HAIR */}
              {activeTab === 'hair' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Hairstyle</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto scroll p-1">
                      {[
                        { id: 'messy', label: 'Messy Top' },
                        { id: 'fade', label: 'Side Fade' },
                        { id: 'afro', label: 'Full Afro' },
                        { id: 'buzz', label: 'Buzz Cut' },
                        { id: 'wavy_long', label: 'Long Waves' },
                        { id: 'bun', label: 'Top Bun' },
                        { id: 'ponytail', label: 'Ponytail' },
                        { id: 'bob', label: 'Chic Bob' },
                        { id: 'anime', label: 'Anime Spikes' },
                        { id: 'dreads', label: 'Dreads' },
                        { id: 'flow', label: 'Middle Flow' },
                        { id: 'bald', label: 'Clean Shaved' },
                      ].map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setConfig({ ...config, hairStyle: h.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                            config.hairStyle === h.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Hair Color</label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {HAIR_COLORS.map((hc) => {
                        const isSelected = config.hairColor.toLowerCase() === hc.color.toLowerCase();
                        return (
                          <button
                            key={hc.name}
                            type="button"
                            onClick={() => setConfig({ ...config, hairColor: hc.color })}
                            className={`aspect-square rounded-xl p-1 border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-500/50'
                                : 'border-transparent hover:border-white/30'
                            }`}
                            style={{ backgroundColor: hc.color }}
                            title={hc.name}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. EYES & BROWS */}
              {activeTab === 'eyes' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Eye Expression</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'normal', label: 'Confident' },
                        { id: 'happy', label: 'Smiling Closed' },
                        { id: 'winking', label: 'Playful Wink' },
                        { id: 'sparkle', label: 'Anime Sparkle' },
                        { id: 'cool', label: 'Chill Narrow' },
                        { id: 'sleepy', label: 'Sleepy / Zen' },
                      ].map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => setConfig({ ...config, eyeStyle: e.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.eyeStyle === e.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Eye Iris Color</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {EYE_COLORS.map((ec) => {
                        const isSelected = config.eyeColor.toLowerCase() === ec.color.toLowerCase();
                        return (
                          <button
                            key={ec.name}
                            type="button"
                            onClick={() => setConfig({ ...config, eyeColor: ec.color })}
                            className={`aspect-square rounded-xl p-1 border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-500/50'
                                : 'border-transparent hover:border-white/30'
                            }`}
                            style={{ backgroundColor: ec.color }}
                            title={ec.name}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Eyebrows</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'natural', label: 'Natural Clean' },
                        { id: 'arched', label: 'High Arched' },
                        { id: 'bushy', label: 'Thick Bushy' },
                        { id: 'slit', label: 'Trending Slit' },
                        { id: 'fierce', label: 'Fierce Angle' },
                      ].map((eb) => (
                        <button
                          key={eb.id}
                          type="button"
                          onClick={() => setConfig({ ...config, eyebrows: eb.id as any })}
                          className={`p-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.eyebrows === eb.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {eb.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MOUTH & LIPS */}
              {activeTab === 'mouth' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Smile & Expression</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'smile_teeth', label: 'Wide Teeth Smile' },
                        { id: 'smirk', label: 'Cheeky Smirk' },
                        { id: 'laugh', label: 'Open Laugh' },
                        { id: 'grin', label: 'Cute Grin' },
                        { id: 'calm', label: 'Calm Smile' },
                        { id: 'fangs', label: 'Vampire Fangs' },
                        { id: 'tongue', label: 'Tongue Out' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setConfig({ ...config, mouth: m.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.mouth === m.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Lip Shade</label>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { name: 'Natural', color: config.skinColor },
                        { name: 'Soft Rose', color: '#FDA4AF' },
                        { name: 'Peach', color: '#FB923C' },
                        { name: 'Crimson', color: '#E11D48' },
                        { name: 'Dark Plum', color: '#881337' },
                        { name: 'Coral Glow', color: '#F43F5E' },
                      ].map((lip) => (
                        <button
                          key={lip.name}
                          type="button"
                          onClick={() => setConfig({ ...config, lipColor: lip.color })}
                          className="aspect-square rounded-xl p-1 border border-white/20 hover:scale-105 transition-transform"
                          style={{ backgroundColor: lip.color }}
                          title={lip.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. BEARD */}
              {activeTab === 'beard' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Facial Hair</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'none', label: 'Clean Shaven' },
                        { id: 'stubble', label: "5 O'clock Stubble" },
                        { id: 'goatee', label: 'Goatee' },
                        { id: 'full', label: 'Full Beard' },
                        { id: 'mustache', label: 'Classic Mustache' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setConfig({ ...config, beard: b.id as any })}
                          className={`p-3 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.beard === b.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. OUTFIT (CHEST-UP) */}
              {activeTab === 'outfit' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Clothing Style (Chest-up)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'hoodie', label: 'Streetwear Hoodie' },
                        { id: 'jacket', label: 'Denim Jacket' },
                        { id: 'crewneck', label: 'Knit Crewneck' },
                        { id: 'tee', label: 'Minimalist Tee' },
                        { id: 'bomber', label: 'Bomber Jacket' },
                        { id: 'formal', label: 'Suit & Tie' },
                        { id: 'cyber', label: 'Cyber Techwear' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setConfig({ ...config, clothing: c.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.clothing === c.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Outfit Color</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {CLOTHING_COLORS.map((cc) => {
                        const isSelected = config.clothingColor.toLowerCase() === cc.color.toLowerCase();
                        return (
                          <button
                            key={cc.name}
                            type="button"
                            onClick={() => setConfig({ ...config, clothingColor: cc.color })}
                            className={`aspect-square rounded-xl p-1 border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? 'border-indigo-500 scale-110 shadow-md ring-2 ring-indigo-500/50'
                                : 'border-transparent hover:border-white/30'
                            }`}
                            style={{ backgroundColor: cc.color }}
                            title={cc.name}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 7. GEAR & GLASSES */}
              {activeTab === 'gear' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Glasses & Shades</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'none', label: 'No Glasses' },
                        { id: 'round', label: 'Round Wireframes' },
                        { id: 'square', label: 'Classic Square' },
                        { id: 'shades', label: 'Wayfarer Sunglasses' },
                        { id: 'visor', label: 'Cyberpunk Visor' },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setConfig({ ...config, glasses: g.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.glasses === g.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white block mb-2">Accessories & Details</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'none', label: 'None' },
                        { id: 'headphones', label: 'Gamer Headphones' },
                        { id: 'earrings', label: 'Gold Hoop Earrings' },
                        { id: 'blush', label: 'Anime Cheek Blush' },
                        { id: 'freckles', label: 'Cute Freckles' },
                      ].map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setConfig({ ...config, accessory: a.id as any })}
                          className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition-all ${
                            config.accessory === a.id
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-white/[0.03] border-white/10 text-[#9DA6B8] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 8. BACKDROP */}
              {activeTab === 'backdrop' && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-white block mb-2">Avatar Backdrop</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BACKDROP_OPTIONS.map((bd) => (
                      <button
                        key={bd.id}
                        type="button"
                        onClick={() => setConfig({ ...config, backdrop: bd.bg })}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                          config.backdrop === bd.bg
                            ? 'border-indigo-500 ring-2 ring-indigo-500/40 bg-white/10'
                            : 'border-white/10 hover:border-white/30 bg-white/[0.03]'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                          style={{ background: bd.bg }}
                        />
                        <span className="text-xs font-semibold text-white truncate">{bd.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 flex items-center justify-between bg-[#131826] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8892B0] hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
          >
            <Check className="w-4 h-4" />
            <span>Use This Avatar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
