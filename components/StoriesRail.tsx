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
    <div className="w-full px-3 py-2.5 border-b border-[#1A202E] bg-[#0A0D14]/70 backdrop-blur select-none">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
        {/* Current User Story Item */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={hasMyStory ? () => onViewStory(myStories[0]) : onCreateStory}
            className="relative group focus:outline-none"
            title={hasMyStory ? 'View your status' : 'Add to status'}
          >
            <div
              className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2.5px] transition-all group-hover:scale-105 active:scale-95 ${
                hasMyStory
                  ? 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-indigo-500 shadow-lg shadow-emerald-500/20'
                  : 'bg-transparent border border-dashed border-white/20'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#161C28] border-2 border-[#0A0D14]">
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
              className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white grid place-items-center border-2 border-[#0A0D14] shadow-md transition-transform group-hover:scale-110"
              title="Add status"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </button>
          <span className="text-[10px] text-[#A8B2C7] font-medium truncate max-w-[60px] text-center">
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
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[2.5px] transition-all group-hover:scale-105 active:scale-95 ${
                    isViewed
                      ? 'border border-slate-600 bg-transparent'
                      : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 shadow-lg shadow-pink-500/20 animate-pulse'
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#161C28] border-2 border-[#0A0D14]">
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
              <span className="text-[10px] text-[#A8B2C7] font-medium truncate max-w-[64px] text-center">
                {story.name.split(' ')[0]}
              </span>
            </div>
          );
        })}

        {otherStories.length === 0 && (
          <div className="flex items-center gap-2 pl-2 text-[11px] text-[#5A6376] italic shrink-0">
            <Sparkles className="w-3 h-3 text-indigo-400/60" />
            <span>Stories disappear after 24h</span>
          </div>
        )}
      </div>
    </div>
  );
}

