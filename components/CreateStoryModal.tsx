'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Type, Sparkles, Check, Upload, Trash2 } from 'lucide-react';
import { UserStory, STORY_GRADIENTS } from '@/types/story';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id?: string;
    username?: string;
    name?: string;
    avatar?: string;
  };
  onPublishStory: (story: Partial<UserStory>) => void;
}

export default function CreateStoryModal({
  isOpen,
  onClose,
  currentUser,
  onPublishStory,
}: CreateStoryModalProps) {
  const [storyType, setStoryType] = useState<'text' | 'image'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(STORY_GRADIENTS[0].value);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (storyType === 'text' && !textContent.trim()) return;
    if (storyType === 'image' && !imagePreview) return;

    setIsSubmitting(true);
    try {
      const newStory: Partial<UserStory> = {
        userId: currentUser.id || `usr_${currentUser.username || 'user'}`,
        username: currentUser.username || 'user',
        name: currentUser.name || 'User',
        avatar: currentUser.avatar || '',
        content: storyType === 'text' ? textContent.trim() : imageCaption.trim() || 'Photo Status',
        mediaUrl: storyType === 'image' ? imagePreview || '' : '',
        bgGradient: selectedGradient,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        views: [],
      };

      await onPublishStory(newStory);
      setTextContent('');
      setImagePreview(null);
      setImageCaption('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const EMOJI_LIST = ['🔥', '✨', '❤️', '😂', '🚀', '⚡', '🎉', '💯', '🍕', '😎', '☕', '🌟'];

  return (
    <div className="fixed inset-0 z-[220] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-msg-in">
      <div className="w-full max-w-md bg-[#111520] border border-[#232B3E] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Add Status / Story</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 grid place-items-center text-[#7A8396] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Text vs Photo */}
        <div className="flex p-2 bg-[#0B0E17] border-b border-white/10 gap-2">
          <button
            type="button"
            onClick={() => setStoryType('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              storyType === 'text'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-[#7A8396] hover:text-white hover:bg-white/5'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Text Status</span>
          </button>
          <button
            type="button"
            onClick={() => setStoryType('image')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              storyType === 'image'
                ? 'bg-pink-600 text-white shadow-md'
                : 'text-[#7A8396] hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo Status</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {storyType === 'text' ? (
            <>
              {/* Text Preview Card */}
              <div
                className={`w-full aspect-[4/3] rounded-2xl bg-gradient-to-tr ${selectedGradient} p-6 flex flex-col items-center justify-center text-center shadow-inner relative transition-all duration-300`}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your status here..."
                  maxLength={250}
                  rows={4}
                  className="w-full bg-transparent text-white font-bold text-center text-lg sm:text-xl placeholder-white/60 resize-none outline-none drop-shadow"
                  autoFocus
                />
                <span className="absolute bottom-3 right-4 text-[10px] text-white/70 font-mono">
                  {textContent.length}/250
                </span>
              </div>

              {/* Gradient Color Palette */}
              <div>
                <label className="text-[11px] font-bold text-[#A8B2C7] uppercase tracking-wider block mb-2">
                  Choose Color Theme
                </label>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {STORY_GRADIENTS.map((grad) => (
                    <button
                      key={grad.name}
                      type="button"
                      onClick={() => setSelectedGradient(grad.value)}
                      className={`w-8 h-8 rounded-full bg-gradient-to-tr ${grad.value} shrink-0 ring-2 transition-transform ${
                        selectedGradient === grad.value
                          ? 'ring-white scale-110 shadow-lg'
                          : 'ring-transparent opacity-80 hover:opacity-100'
                      }`}
                      title={grad.name}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Emojis */}
              <div>
                <label className="text-[11px] font-bold text-[#A8B2C7] uppercase tracking-wider block mb-2">
                  Add Emoji
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {EMOJI_LIST.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setTextContent((prev) => prev + em)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 grid place-items-center text-base shrink-0 active:scale-95 transition-all"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Photo Upload Area */}
              {imagePreview ? (
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/10 group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-600 text-white grid place-items-center transition-colors shadow-lg"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/20 hover:border-pink-500/50 bg-[#0B0E17] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 group-hover:scale-110 grid place-items-center transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white">Upload Status Photo</p>
                    <p className="text-[10px] text-[#7A8396] mt-0.5">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                </label>
              )}

              {/* Photo Caption */}
              <div>
                <label className="text-[11px] font-bold text-[#A8B2C7] uppercase tracking-wider block mb-1">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Add a caption to your photo..."
                  maxLength={120}
                  className="w-full bg-[#0D1017] border border-[#232B3E] focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#5A6376] outline-none"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (storyType === 'text' && !textContent.trim()) ||
                (storyType === 'image' && !imagePreview)
              }
              className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 active:scale-[0.98] transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Publishing...' : 'Share Status (24 Hours)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

