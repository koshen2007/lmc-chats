'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { UserStory } from '@/types/story';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: UserStory | null;
  allStories: UserStory[];
  currentUser: {
    username?: string;
    name?: string;
  };
  onSendStoryReply: (targetHandle: string, storyContent: string, replyText: string) => void;
  onMarkViewed: (storyId: string) => void;
}

export default function StoryViewerModal({
  isOpen,
  onClose,
  story,
  allStories,
  currentUser,
  onSendStoryReply,
  onMarkViewed,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyInput, setReplyInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  // Group stories by current user or show relevant stories list
  const activeStoriesList = React.useMemo(() => {
    if (!story) return [];
    // Show all stories from this author
    const authorStories = allStories.filter(
      (s) => s.username.toLowerCase() === story.username.toLowerCase()
    );
    return authorStories.length > 0 ? authorStories : [story];
  }, [story, allStories]);

  useEffect(() => {
    if (!isOpen || !story) return;
    const idx = activeStoriesList.findIndex((s) => s.id === story.id);
    setCurrentIndex(idx !== -1 ? idx : 0);
    setProgress(0);
  }, [isOpen, story, activeStoriesList]);

  const activeStory = activeStoriesList[currentIndex] || story;

  // Mark current story as viewed
  useEffect(() => {
    if (activeStory && isOpen) {
      onMarkViewed(activeStory.id);
    }
  }, [activeStory?.id, isOpen]);

  // Auto-progress timer (5 seconds)
  useEffect(() => {
    if (!isOpen || isPaused || !activeStory) return;

    const interval = 50; // update every 50ms
    const step = (100 / (5000 / interval)); // 5 seconds total

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story or close
          if (currentIndex < activeStoriesList.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, currentIndex, activeStoriesList.length, activeStory]);

  if (!isOpen || !activeStory) return null;

  const handleNext = () => {
    if (currentIndex < activeStoriesList.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;
    onSendStoryReply(activeStory.username, activeStory.content, replyInput.trim());
    setReplyInput('');
    onClose();
  };

  const timeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const isMyStory =
    activeStory.username.toLowerCase() ===
    (currentUser.username || currentUser.name || '').toLowerCase();

  return (
    <div className="fixed inset-0 z-[230] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 select-none animate-msg-in">
      <div
        className="relative w-full max-w-md h-[92vh] max-h-[800px] rounded-3xl overflow-hidden bg-[#0A0D14] border border-white/10 flex flex-col shadow-2xl"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars (WhatsApp / Instagram style) */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {activeStoriesList.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
            >
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width:
                    i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/40 shadow-md">
              <img
                src={activeStory.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${activeStory.username}`}
                alt={activeStory.name}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">{activeStory.name}</p>
              <p className="text-[10px] text-white/70 font-mono">
                @{activeStory.username} • {timeAgo(activeStory.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMyStory && (
              <span className="flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur px-2 py-0.5 rounded-full text-emerald-400 font-semibold border border-white/10">
                <Eye className="w-3 h-3" />
                <span>{activeStory.views.length} views</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur grid place-items-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Left & Right Tap Zones for Navigation */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-0 top-16 bottom-20 w-1/4 z-20 cursor-pointer focus:outline-none flex items-center pl-2 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-black/40 text-white grid place-items-center backdrop-blur">
            <ChevronLeft className="w-5 h-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-0 top-16 bottom-20 w-1/4 z-20 cursor-pointer focus:outline-none flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-black/40 text-white grid place-items-center backdrop-blur">
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        {/* Story Body Content */}
        <div className="flex-1 w-full h-full relative flex items-center justify-center overflow-hidden">
          {activeStory.mediaUrl ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <img
                src={activeStory.mediaUrl}
                alt="Story"
                className="w-full h-full object-contain"
              />
              {activeStory.content && (
                <div className="absolute bottom-20 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-center">
                  <p className="text-sm font-semibold text-white">{activeStory.content}</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-tr ${
                activeStory.bgGradient || 'from-indigo-600 via-purple-600 to-pink-600'
              } flex items-center justify-center p-8 text-center`}
            >
              <p className="text-xl sm:text-2xl font-bold text-white drop-shadow-md leading-relaxed break-words max-w-sm">
                {activeStory.content}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Reply Bar (If not own story) */}
        {!isMyStory ? (
          <div className="p-3 bg-[#0A0D14]/90 backdrop-blur border-t border-white/10 relative z-30">
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder={`Reply to ${activeStory.name.split(' ')[0]}...`}
                className="flex-1 bg-white/10 border border-white/15 focus:border-indigo-400 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/50 outline-none backdrop-blur"
              />
              <button
                type="submit"
                disabled={!replyInput.trim()}
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white grid place-items-center shrink-0 transition-transform active:scale-95 shadow-md"
              >
                <Send className="w-4 h-4 -rotate-45" />
              </button>
            </form>
          </div>
        ) : (
          <div className="p-3 bg-[#0A0D14]/90 backdrop-blur border-t border-white/10 relative z-30 text-center">
            <p className="text-[11px] text-[#A8B2C7]">
              {activeStory.views.length > 0
                ? `Viewed by ${activeStory.views.map((v) => `@${v}`).join(', ')}`
                : 'No views yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
