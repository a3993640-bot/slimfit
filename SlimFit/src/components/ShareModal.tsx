
import React from 'react';
import { UserProfile } from '../types';
import { X, Download, Copy } from 'lucide-react';

interface ShareModalProps {
  user: UserProfile;
  daysPassed: number;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ user, daysPassed, onClose }) => {
  const lost = (user.startWeight - user.currentWeight).toFixed(1);
  const percentage = ((user.startWeight - user.currentWeight) / user.startWeight * 100).toFixed(1);
  const isImageAvatar = user.avatar.startsWith('data:');

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-md p-6 animate-fade-in">
       <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
          <X className="w-8 h-8" />
       </button>

       <div className="flex flex-col items-center w-full max-w-sm">
            {/* The Card */}
            <div className="w-full aspect-[9/16] bg-gradient-to-bl from-zinc-800 to-black rounded-[2rem] p-8 relative shadow-2xl flex flex-col justify-between text-white overflow-hidden border border-white/10">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-mint-500/20 rounded-full blur-[80px] mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] mix-blend-screen"></div>

                {/* Header */}
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-lg overflow-hidden">
                        {isImageAvatar ? (
                             <img src={user.avatar} className="w-full h-full object-cover" />
                        ) : (
                             user.avatar
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl tracking-tight text-white">{user.name}</h3>
                        <p className="text-zinc-400 text-xs uppercase tracking-[0.2em]">Day {daysPassed + 1} // SlimFit</p>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="relative z-10">
                    <div className="text-zinc-400 text-sm uppercase tracking-widest mb-2 font-medium">累计减重</div>
                    <div className="text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                        -{lost}<span className="text-4xl font-medium text-zinc-500 ml-1">kg</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-mint-500/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-mint-400 border border-mint-500/20">
                         <span>🔥 已减掉 {percentage}% 的体重</span>
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="relative z-10">
                    <div className="bg-white/5 backdrop-blur-md text-zinc-200 p-6 rounded-2xl border border-white/10">
                        <p className="font-serif italic text-lg leading-relaxed text-center mb-6 opacity-90">
                            "自律即自由。<br/>The only bad workout is the one that didn't happen."
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold border-t border-white/5 pt-4 uppercase tracking-widest">
                            <span>SlimFit App</span>
                            <span className="text-mint-400">{user.coins} Coins</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 w-full">
                <button className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5">
                    <Download className="w-5 h-5" /> 保存图片
                </button>
                 <button className="flex-1 bg-zinc-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors border border-zinc-700">
                    <Copy className="w-5 h-5" /> 复制链接
                </button>
            </div>
       </div>
    </div>
  );
};
