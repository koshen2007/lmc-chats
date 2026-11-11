'use client';

import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { UserStory } from '@/types/story';
import { DEFAULT_AVATAR_DATA_URL } from '@/lib/avatarStudio';

interface StoriesRailProps {
  currentUser: {
    id?: string;
    username?: string;
    name?: string;
    avatar?: string;
  };
  stories: UserStory[];
  onCreateStory: () => void;
  onViewStory: (story: UserStory) => void;
}

export default function StoriesRail({
  currentUser,
  stories,
  onCreateStory,
  onViewStory,
}: StoriesRailProps) {
  const myUsername = (currentUser.username || currentUser.name || '').toLowerCase();

  // Find user's own active stories
  const myStories = stories.filter((s) => s.username.toLowerCase() === myUsername);
  const hasMyStory = myStories.length > 0;

  // Group stories from other users (deduplicated by user, taking latest story)
  const otherUsersMap = new Map<string, UserStory>();
  for (const s of stories) {
    if (s.username.toLowerCase() !== myUsername) {
      if (!otherUsersMap.has(s.username.toLowerCase())) {
        otherUsersMap.set(s.username.toLowerCase(), s);
      }
    }
  }
  const otherStories = Array.from(otherUsersMap.values());

  return (
    <div className="w-full px-3 py-2.5 border-b border-white/[0.07] bg-[#0B0E14] select-none">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
        {/* Current User Story Item */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={hasMyStory ? () => onViewStory(myStories[0]) : onCreateStory}
            className="relative group focus:outline-none"
            title={hasMyStory ? 'View your status' : 'Add status'}
          >
            <div
              className={`w-12 h-12 rounded-full p-[2px] transition-transform group-hover:scale-105 active:scale-95 ${
                hasMyStory
                  ? 'bg-gradient-to-tr from-indigo-500 to-emerald-400'
                  : 'border border-dashed border-white/20'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#171D2B] border-2 border-[#0B0E14]">
                <img
                  src={currentUser.avatar || DEFAULT_AVATAR_DATA_URL}
                  alt=""
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                  }}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Plus badge on avatar */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                onCreateStory();
              }}
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white grid place-items-center border-2 border-[#0B0E14] shadow-sm transition-transform group-hover:scale-110"
              title="Add status"
            >
              <Plus className="w-2.5 h-2.5 stroke-[3]" />
            </div>
          </button>
          <span className="text-[10px] text-[#A6B0C3] font-medium truncate max-w-[60px] text-center">
            {hasMyStory ? 'My Status' : 'Add Status'}
          </span>
        </div>

        {/* Other Users' Stories */}
        {otherStories.map((story) => {
          const isViewed = story.views.includes(myUsername);
          return (
            <div key={story.id} className="flex flex-col items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onViewStory(story)}
                className="relative group focus:outline-none"
                title={`View ${story.name}'s status`}
              >
                <div
                  className={`w-12 h-12 rounded-full p-[2px] transition-transform group-hover:scale-105 active:scale-95 ${
                    isViewed
                      ? 'border border-white/15 bg-transparent'
                      : 'bg-gradient-to-tr from-indigo-500 to-emerald-400'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#171D2B] border-2 border-[#0B0E14]">
                    <img
                      src={story.avatar || DEFAULT_AVATAR_DATA_URL}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_AVATAR_DATA_URL;
                      }}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                </div>
              </button>
              <span className="text-[10px] text-[#A6B0C3] font-medium truncate max-w-[64px] text-center">
                {story.name.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {otherStories.length === 0 && (
          <div className="flex items-center gap-1.5 pl-1 text-[11px] text-[#6C7689] shrink-0">
            <span>Share 24h status updates with your team</span>
          </div>
        )}
      </div>
    </div>
  );
}

