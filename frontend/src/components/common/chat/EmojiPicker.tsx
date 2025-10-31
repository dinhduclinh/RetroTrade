"use client";

import React from "react";

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = {
  "😀": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔"],
  "😢": ["😢", "😟", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😰", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😴", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷"],
  "👍": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👋", "🤚", "🖐", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂"],
  "❤️": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐"],
  "🎉": ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🥅", "🏒", "🏑", "🏏", "⛳", "🏹", "🎣", "🥊", "🥋", "🎽", "🛹", "🛷"],
  "🌟": ["🌟", "⭐", "✨", "💫", "☀️", "🌙", "☀️", "🌞", "⭐", "🌟", "💫", "✨", "⭐", "🌟", "💫", "✨", "🔥", "💥", "⚡", "☄️", "💨", "🌪️", "🌈", "☂️", "☔", "⛈️", "🌩️", "🌨️", "❄️", "☃️"],
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<keyof typeof EMOJI_CATEGORIES>("😀");

  const handleEmojiClick = (emoji: string) => {
    onSelectEmoji(emoji);
  };

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <div className="flex gap-1">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
              className={`text-2xl p-1 rounded hover:bg-gray-100 transition-colors ${
                selectedCategory === category ? "bg-gray-200" : ""
              }`}
              title={category}
            >
              {category}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Emoji grid */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
            <button
              key={`${selectedCategory}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl p-2 hover:bg-gray-100 rounded transition-colors active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
