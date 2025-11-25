
import React, { useState, useEffect } from 'react';
import { UserProfile, DailyLog, ChatMessage, BeforeInstallPromptEvent } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { formatDate, generateUUID } from './utils';

// Simple Confetti Implementation
const triggerConfetti = () => {
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (Math.random() * 2 + 2) + 's';
    el.style.backgroundColor = ['#34d399', '#f472b6', '#fbbf24', '#60a5fa'][Math.floor(Math.random() * 4)];
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [penaltyMessage, setPenaltyMessage] = useState<string | null>(null);
  
  // Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Persistence Load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('slimfit_user');
      const savedLogs = localStorage.getItem('slimfit_logs');
      const savedChat = localStorage.getItem('slimfit_chat');
      
      if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (!parsedUser.userId) parsedUser.userId = generateUUID();
          setUser(parsedUser);
      }
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      if (savedChat) setChatHistory(JSON.parse(savedChat));
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Capture Install Prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Persistence Save
  useEffect(() => {
    try {
      if (user) localStorage.setItem('slimfit_user', JSON.stringify(user));
      localStorage.setItem('slimfit_logs', JSON.stringify(logs));
      localStorage.setItem('slimfit_chat', JSON.stringify(chatHistory.slice(-50))); 
    } catch (e) {
      console.error("Storage failed", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
         console.warn("LocalStorage quota exceeded.");
      }
    }
  }, [user, logs, chatHistory]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser({ ...profile, name: '我', userId: generateUUID() }); 
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleResetPlan = (updatedUser: UserProfile) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const newUserState = {
        ...updatedUser,
        startDate: today.toISOString(),
        startWeight: updatedUser.currentWeight, 
    };
    setUser(newUserState);
    setLogs([]); 
    
    const sysMsg: ChatMessage = {
        id: generateUUID(),
        userId: 'system',
        userName: '系统',
        content: `计划已重置！${newUserState.name} 开启了新的挑战。`,
        timestamp: Date.now(),
        type: 'system'
    };
    setChatHistory(prev => [...prev, sysMsg]);
  };

  const handleCheckIn = (weight: number, photo?: string, reflection?: string) => {
    const today = formatDate(new Date());
    const newLog: DailyLog = {
        date: today,
        weight,
        photo,
        reflection,
        isTargetMet: true 
    };
    
    setLogs(prev => [...prev.filter(l => l.date !== today), newLog]);
    setUser(prev => prev ? { ...prev, currentWeight: weight } : null);
    triggerConfetti();
  };

  const handlePenalty = (amount: number) => {
      if (user) {
          setUser(prev => prev ? { ...prev, coins: Math.max(0, prev.coins - amount) } : null);
          setPenaltyMessage(`今日未达标！已自动扣除 ${amount} 金币发给队友。`);
          setTimeout(() => setPenaltyMessage(null), 4000);
          
          const sysMsg: ChatMessage = {
              id: generateUUID(),
              userId: 'system',
              userName: '系统',
              content: `${user.name} 今日打卡未达标，发了 ${amount} 金币红包！`,
              timestamp: Date.now(),
              type: 'system'
          };
          setChatHistory(prev => [...prev, sysMsg]);
      }
  };

  const handleNewChatMessage = (msg: ChatMessage) => {
      setChatHistory(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
      });
  };

  // Trigger Install Flow
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-mint-500">
        <div className="w-8 h-8 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="font-bold tracking-widest text-sm uppercase">SlimFit Loading...</div>
    </div>
  );

  return (
    <>
      {!user ? (
        <Onboarding onComplete={handleOnboardingComplete} />
      ) : (
        <Dashboard 
            user={user} 
            logs={logs} 
            chatHistory={chatHistory}
            onCheckIn={handleCheckIn} 
            onPenalty={handlePenalty}
            onUpdateUser={handleUpdateUser}
            onResetPlan={handleResetPlan}
            onNewChatMessage={handleNewChatMessage}
            installPrompt={deferredPrompt}
            onInstall={handleInstallApp}
        />
      )}
      
      {penaltyMessage && (
          <div className="fixed top-4 left-4 right-4 z-[70] animate-slide-down flex justify-center">
              <div className="bg-coral-500 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 border border-coral-400/50 backdrop-blur-md max-w-sm w-full">
                  <div className="bg-white/20 p-2 rounded-full">💸</div>
                  <p className="font-bold text-sm">{penaltyMessage}</p>
              </div>
          </div>
      )}
    </>
  );
};

export default App;
