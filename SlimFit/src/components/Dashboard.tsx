
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, DailyLog, ChatMessage, RouteType, Teammate, BeforeInstallPromptEvent } from '../types';
import { calculateDailyTarget, getDaysPassed, formatDate, generateId, generateUUID, formatChartDate } from '../utils';
import { getDailyPlan, AGGRESSIVE_DIET, GENTLE_DIET } from '../constants';
import { CheckInModal } from './CheckInModal';
import { ShareModal } from './ShareModal';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { Plus, Share2, TrendingDown, Home, Calendar, Users, User, Send, Edit2, History, LogOut, Copy, Wifi, Info, Camera, X, AlertTriangle, Clock, Download, Smartphone, ArrowDown } from 'lucide-react';

// Declare mqtt global
declare const mqtt: any;

interface DashboardProps {
  user: UserProfile;
  logs: DailyLog[];
  chatHistory: ChatMessage[];
  onCheckIn: (weight: number, photo: string | undefined, reflection: string | undefined) => void;
  onPenalty: (amount: number) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onResetPlan: (updatedUser: UserProfile) => void;
  onNewChatMessage: (msg: ChatMessage) => void;
  installPrompt: BeforeInstallPromptEvent | null;
  onInstall: () => void;
}

type Tab = 'home' | 'plan' | 'social' | 'me';

const Avatar: React.FC<{ src: string, size?: string, className?: string }> = ({ src, size = "w-14 h-14", className = "" }) => {
    const safeSrc = src || "?";
    const isImage = safeSrc.startsWith('data:');
    return (
        <div className={`${size} rounded-full bg-dark-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner ${className}`}>
            {isImage ? (
                <img src={safeSrc} alt="avatar" className="w-full h-full object-cover" />
            ) : (
                <span className="text-3xl">{safeSrc}</span>
            )}
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, logs, chatHistory, onCheckIn, onPenalty, onUpdateUser, onResetPlan, onNewChatMessage, installPrompt, onInstall }) => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  
  const [tutorialStep, setTutorialStep] = useState(0);

  const planWeeks = user.planWeeks || 8;
  const currentRoute = user.route || 'gentle';

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editTargetWeight, setEditTargetWeight] = useState(user.targetWeight);
  const [editPlanWeeks, setEditPlanWeeks] = useState(planWeeks);
  
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  
  const editTotalLoss = user.currentWeight - editTargetWeight;
  const editWeeklyLoss = editTotalLoss / editPlanWeeks;
  let editRecommendedRoute: RouteType = editWeeklyLoss > 0.6 ? 'aggressive' : 'gentle'; 

  const todayStr = formatDate(new Date());
  const hasCheckedInToday = logs.some(l => l.date === todayStr);
  const daysPassed = getDaysPassed(user.startDate);
  const dailyPlan = getDailyPlan(currentRoute, daysPassed);
  
  const totalDays = planWeeks * 7;
  const todayTarget = calculateDailyTarget(
      user.startWeight, 
      user.targetWeight, 
      user.startDate, 
      todayStr, 
      currentRoute, 
      totalDays
  );
  
  const weightProgress = Math.min(100, Math.max(0, ((user.startWeight - user.currentWeight) / (user.startWeight - user.targetWeight)) * 100));
  const timeProgress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('slimfit_tutorial_seen');
    if (!hasSeenTutorial) {
        const timer = setTimeout(() => setTutorialStep(1), 600);
        return () => clearTimeout(timer);
    }
  }, []);

  const completeTutorial = () => {
      setTutorialStep(0);
      localStorage.setItem('slimfit_tutorial_seen', 'true');
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  const handleInstallClick = () => {
      if (isIOS && !isStandalone) {
          setShowIOSInstall(true);
      } else if (installPrompt) {
          onInstall();
      }
  };

  const HomeView = () => {
    const chartData = [];
    const startDate = new Date(user.startDate);
    startDate.setHours(0,0,0,0);
    
    chartData.push({
        timestamp: startDate.getTime(),
        weight: user.startWeight,
        target: user.startWeight,
        type: 'start'
    });

    logs.forEach(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0,0,0,0);
        if (logDate.getTime() >= startDate.getTime()) {
             const target = calculateDailyTarget(user.startWeight, user.targetWeight, user.startDate, log.date, currentRoute, totalDays);
             chartData.push({
                 timestamp: logDate.getTime(),
                 weight: log.weight,
                 target: target,
                 type: 'log'
             });
        }
    });

    const today = new Date();
    today.setHours(0,0,0,0);
    if (!hasCheckedInToday && today.getTime() >= startDate.getTime()) {
        chartData.push({
            timestamp: today.getTime(),
            weight: null,
            target: todayTarget,
            type: 'today'
        });
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);
    chartData.push({
        timestamp: endDate.getTime(),
        weight: null,
        target: user.targetWeight,
        type: 'end'
    });

    chartData.sort((a, b) => a.timestamp - b.timestamp);

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-6 rounded-[2rem] shadow-xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-mint-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-3">
               <Avatar src={user.avatar} />
               <div>
                 <h1 className="font-bold text-white text-lg tracking-tight">你好, {user.name}</h1>
                 <div className="flex items-center gap-2">
                   <span className={`text-xs px-2 py-0.5 rounded border ${currentRoute === 'aggressive' ? 'text-coral-400 bg-coral-900/20 border-coral-500/20' : 'text-mint-400 bg-mint-900/20 border-mint-500/20'}`}>
                     {currentRoute === 'aggressive' ? '🔥 极限冲刺' : '🍃 平稳减脂'}
                   </span>
                 </div>
               </div>
            </div>
            <div className="flex items-center gap-2">
                {!isStandalone && (installPrompt || isIOS) && (
                    <button 
                        onClick={handleInstallClick}
                        className="p-2 bg-mint-500 text-dark-900 rounded-full font-bold text-xs flex items-center gap-1 hover:bg-mint-400 transition-colors shadow-lg shadow-mint-500/20"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">下载App</span>
                    </button>
                )}
                <button 
                  onClick={() => setIsShareOpen(true)}
                  className="p-3 bg-white/5 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition-colors border border-white/5 backdrop-blur-sm"
                >
                  <Share2 className="w-5 h-5" />
                </button>
            </div>
          </div>
  
          <div className="flex justify-between items-end mb-5 px-1 relative z-10">
              <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">今日目标</p>
                  <div className="text-3xl font-bold text-white tracking-tight tabular-nums">{todayTarget.toFixed(1)} <span className="text-sm font-medium text-zinc-600">kg</span></div>
              </div>
              <div className="text-right">
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">当前体重</p>
                  <div className={`text-5xl font-black tracking-tighter tabular-nums ${user.currentWeight <= todayTarget + 0.5 ? 'text-mint-400' : 'text-coral-400'}`}>
                    {user.currentWeight} <span className="text-lg font-medium text-zinc-600">kg</span>
                  </div>
              </div>
          </div>
  
          <div className="relative z-10 mb-4">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">
                 <span>🏆 目标进度</span>
                 <span>{user.targetWeight}kg</span>
              </div>
              <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden relative border border-white/5">
                  <div 
                      className="bg-gradient-to-r from-mint-600 to-mint-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                      style={{ width: `${weightProgress}%` }}
                  ></div>
              </div>
              <div className="text-right text-[10px] text-mint-400 mt-1 font-bold">
                 已完成 {weightProgress.toFixed(0)}%
              </div>
          </div>

          <div className="relative z-10">
              <div className="flex justify-between text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wider">
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 时间进度</span>
                 <span>Day {daysPassed} / {totalDays}</span>
              </div>
              <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden relative border border-white/5">
                  <div 
                      className="bg-zinc-600 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${timeProgress}%` }}
                  ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-zinc-600 mt-1 font-medium">
                 <span>共 {planWeeks} 周</span>
                 <span>{timeProgress.toFixed(0)}%</span>
              </div>
          </div>
        </div>
  
        <div className="flex justify-center relative z-30">
          {tutorialStep === 1 && (
            <>
                <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-[2px]" onClick={completeTutorial}></div>
                <div className="absolute bottom-full left-0 right-0 mb-4 z-50 animate-fade-in flex justify-center">
                     <div className="bg-mint-500 text-zinc-900 p-5 rounded-2xl shadow-[0_0_50px_rgba(52,211,153,0.3)] w-72 text-center relative">
                        <h4 className="font-black text-lg mb-1">👋 欢迎加入!</h4>
                        <p className="text-sm font-medium mb-4 leading-relaxed">这是你的控制台。每天记得点击这里<br/>记录体重，生成你的专属曲线！</p>
                        <div className="flex justify-center gap-3">
                            <button onClick={completeTutorial} className="text-xs font-bold text-zinc-700 underline opacity-70 hover:opacity-100">跳过</button>
                            <button onClick={(e) => { e.stopPropagation(); setTutorialStep(2); }} className="bg-zinc-900 text-mint-500 px-6 py-2 rounded-full text-xs font-bold shadow-lg transform hover:scale-105 transition-all">下一步</button>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-mint-500 rotate-45"></div>
                     </div>
                </div>
            </>
          )}

          {hasCheckedInToday ? (
               <div className="w-full bg-mint-500/10 border border-mint-500/30 text-mint-400 px-8 py-5 rounded-2xl flex items-center justify-center gap-2 font-bold relative z-30">
                  <span>🎉 今日已打卡，继续保持！</span>
               </div>
          ) : (
              <button 
                  onClick={() => setIsCheckInOpen(true)}
                  className="w-full bg-white text-zinc-900 px-8 py-5 rounded-2xl shadow-[0_4px_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 font-bold text-lg hover:bg-zinc-100 transition-all active:scale-[0.98] relative z-30"
              >
                  <Plus className="w-6 h-6" /> 记录今日体重
              </button>
          )}
        </div>
  
        <div>
          <h3 className="font-bold text-zinc-200 mb-4 text-lg flex items-center gap-2">
              今日任务 <span className="text-xs bg-dark-800 text-zinc-500 px-2 py-1 rounded-md border border-white/5 font-normal font-mono">
                  {daysPassed === 0 ? 'DAY 0 准备' : `DAY ${daysPassed}`}
              </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="glass-card p-5 rounded-2xl flex items-start gap-4 border border-white/5 bg-dark-800/40">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                      <div className="text-xs font-bold text-orange-400 uppercase mb-1 tracking-wider">饮食建议</div>
                      <p className="font-medium text-white text-sm leading-relaxed">{dailyPlan.food}</p>
                  </div>
              </div>
              <div className="glass-card p-5 rounded-2xl flex items-start gap-4 border border-white/5 bg-dark-800/40">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-5 h-5 rotate-180" />
                  </div>
                  <div>
                      <div className="text-xs font-bold text-blue-400 uppercase mb-1 tracking-wider">运动目标</div>
                      <p className="font-medium text-white text-sm leading-relaxed">{dailyPlan.workout}</p>
                  </div>
              </div>
          </div>
        </div>
  
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-zinc-200 text-lg">全周期趋势</h3>
            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
               <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-zinc-500"></div>理想曲线</div>
               <div className="flex items-center gap-1"><div className="w-2 h-2 bg-mint-500 rounded-full"></div>实际打卡</div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-3xl h-64 border border-white/5 bg-dark-800/30">
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                      <XAxis 
                          type="number"
                          dataKey="timestamp" 
                          domain={['dataMin', 'dataMax']}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 10, fill: '#71717a'}} 
                          dy={10} 
                          tickFormatter={formatChartDate}
                          interval="preserveStartEnd"
                      />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                          labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                      />
                      <ReferenceLine y={user.targetWeight} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.2} label={{ value: '目标', position: 'insideBottomRight', fill: '#10B981', fontSize: 10 }} />
                      
                      <Line 
                          name="理想曲线" 
                          type="monotone" 
                          dataKey="target" 
                          stroke="#52525b" 
                          strokeDasharray="3 3" 
                          strokeWidth={2} 
                          dot={false} 
                          isAnimationActive={false} 
                          connectNulls={false} 
                      />
                      
                      <Line 
                          name="实际体重" 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#34d399" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: '#09090b', strokeWidth: 2, stroke: '#34d399' }} 
                          activeDot={{ r: 6, fill: '#34d399' }} 
                          connectNulls={true} 
                      />
                  </LineChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const PlanView = () => {
    const fullPlan = currentRoute === 'aggressive' ? AGGRESSIVE_DIET : GENTLE_DIET;
    const currentDayIndex = Math.max(0, daysPassed % 7);

    return (
      <div className="space-y-6 animate-fade-in pb-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">减脂计划表</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className={`text-xs px-2 py-0.5 rounded border ${currentRoute === 'aggressive' ? 'text-coral-400 bg-coral-900/20 border-coral-500/20' : 'text-mint-400 bg-mint-900/20 border-mint-500/20'}`}>
                {currentRoute === 'aggressive' ? '极限冲刺模式' : '平稳减脂模式'}
             </span>
             <p className="text-zinc-400 text-sm">第 {Math.floor(daysPassed / 7) + 1} 周</p>
          </div>
        </div>

        <div className="space-y-4">
          {fullPlan.map((day, idx) => {
            const isToday = idx === currentDayIndex;
            return (
              <div 
                key={day.day} 
                className={`p-5 rounded-2xl border transition-all ${isToday ? 'bg-mint-900/10 border-mint-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-dark-800/40 border-white/5 opacity-80'}`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${isToday ? 'bg-mint-500 text-dark-950' : 'bg-dark-700 text-zinc-400'}`}>
                      Day {day.day}
                    </span>
                    <span className={`font-bold ${isToday ? 'text-white' : 'text-zinc-300'}`}>{day.title}</span>
                  </div>
                  {isToday && <span className="text-xs text-mint-400 font-bold tracking-wider uppercase">Today</span>}
                </div>
                
                <div className="space-y-3 pl-1">
                  <div className="flex items-start gap-3">
                     <div className="w-1 h-1 rounded-full bg-orange-400 mt-2 shrink-0"></div>
                     <p className="text-sm text-zinc-300 leading-relaxed"><span className="text-zinc-500 text-xs uppercase mr-2">Diet</span>{day.food}</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <div className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                     <p className="text-sm text-zinc-300 leading-relaxed"><span className="text-zinc-500 text-xs uppercase mr-2">Sport</span>{day.workout}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SocialView = () => {
    const [client, setClient] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [joinInput, setJoinInput] = useState('');
    const [teammates, setTeammates] = useState<Teammate[]>([]);
    const [msgInput, setMsgInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    useEffect(() => {
        if (!user.teamId) return;

        const mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
            clientId: `slimfit_${user.userId}_${Date.now()}`,
            keepalive: 60,
            clean: true,
            reconnectPeriod: 1000,
        });

        mqttClient.on('connect', () => {
            setIsConnected(true);
            setClient(mqttClient);
            mqttClient.subscribe(`slimfit/team/${user.teamId}/#`);
            publishPresence(mqttClient);
        });

        mqttClient.on('message', (topic: string, message: Buffer) => {
            try {
                const payload = JSON.parse(message.toString());
                if (topic.includes('/presence')) {
                    handlePresenceUpdate(payload);
                } else if (topic.includes('/chat')) {
                    onNewChatMessage(payload);
                }
            } catch (e) {
                console.error("MQTT Parse Error", e);
            }
        });

        return () => {
            if (mqttClient) mqttClient.end();
        };
    }, [user.teamId]);

    const publishPresence = (c: any) => {
        if (!c || !user.teamId) return;
        const myData: Teammate = {
            userId: user.userId,
            name: user.name,
            avatar: user.avatar,
            status: hasCheckedInToday ? 'success' : 'pending',
            weightLost: parseFloat((user.startWeight - user.currentWeight).toFixed(1)),
            lastSeen: Date.now()
        };
        c.publish(`slimfit/team/${user.teamId}/presence`, JSON.stringify(myData), { retain: true });
    };

    const handlePresenceUpdate = (data: Teammate) => {
        setTeammates(prev => {
            if (data.userId === user.userId) return prev;
            const existing = prev.findIndex(t => t.userId === data.userId);
            if (existing > -1) {
                const newArr = [...prev];
                newArr[existing] = data;
                return newArr;
            } else {
                return [...prev, data];
            }
        });
    };

    const handleCreateTeam = () => {
        const newId = generateId();
        onUpdateUser({ ...user, teamId: newId });
    };

    const handleJoinTeam = () => {
        if (joinInput.length === 6) {
            onUpdateUser({ ...user, teamId: joinInput.toUpperCase() });
        }
    };

    const handleSendMsg = () => {
        if (!msgInput.trim() || !client) return;
        const msg: ChatMessage = {
            id: generateUUID(),
            userId: user.userId,
            userName: user.name,
            avatar: user.avatar,
            content: msgInput,
            timestamp: Date.now(),
            type: 'text'
        };
        onNewChatMessage(msg);
        client.publish(`slimfit/team/${user.teamId}/chat`, JSON.stringify(msg));
        setMsgInput('');
    };

    const copyTeamId = () => {
        if (user.teamId) {
            navigator.clipboard.writeText(user.teamId);
        }
    };

    if (!user.teamId) {
        return (
            <div className="h-full flex flex-col items-center p-6 space-y-6 animate-fade-in pb-20">
                <div className="text-center mt-4">
                    <h2 className="text-2xl font-bold text-white mb-2">减肥小分队</h2>
                    <p className="text-zinc-400 text-sm">找到志同道合的队友，互相监督！</p>
                </div>

                <div className="w-full bg-dark-800/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-mint-500" /> 怎么玩？
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-bold text-zinc-400 shrink-0">1</div>
                            <div>
                                <h4 className="text-white text-sm font-bold">创建暗号</h4>
                                <p className="text-zinc-500 text-xs">点击下方创建按钮，获得一个专属的 6 位数暗号。</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-bold text-zinc-400 shrink-0">2</div>
                            <div>
                                <h4 className="text-white text-sm font-bold">分享给好友</h4>
                                <p className="text-zinc-500 text-xs">把暗号发给朋友，让他们输入暗号加入队伍。</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-bold text-zinc-400 shrink-0">3</div>
                            <div>
                                <h4 className="text-white text-sm font-bold">即时互动</h4>
                                <p className="text-zinc-500 text-xs">实时看到队友的减重进度，还可以聊天打气！</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <button 
                        onClick={handleCreateTeam}
                        className="w-full py-4 bg-mint-500 text-dark-900 rounded-2xl font-bold text-lg shadow-lg hover:bg-mint-400 transition-all"
                    >
                        创建新队伍
                    </button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-dark-950 px-2 text-zinc-500">已有暗号？</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="输入 6 位队伍暗号"
                            maxLength={6}
                            value={joinInput}
                            onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                            className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 text-center text-white tracking-widest uppercase font-mono focus:border-mint-500 outline-none"
                        />
                        <button 
                            onClick={handleJoinTeam}
                            disabled={joinInput.length !== 6}
                            className="px-6 bg-zinc-800 text-white rounded-xl font-bold disabled:opacity-50 hover:bg-zinc-700 transition-colors"
                        >
                            加入
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
      <div className="space-y-4 animate-fade-in pb-20 h-full flex flex-col">
        <div className="bg-dark-800/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-white">小分队 #{user.teamId}</h2>
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-mint-500' : 'bg-red-500 animate-pulse'}`}></span>
                </div>
                <p className="text-xs text-zinc-500 flex items-center gap-1 cursor-pointer hover:text-white" onClick={copyTeamId}>
                    点击复制暗号邀请好友 <Copy className="w-3 h-3" />
                </p>
            </div>
            <div className="flex -space-x-3">
                 {teammates.slice(0, 3).map(t => (
                     <Avatar key={t.userId} src={t.avatar} size="w-10 h-10" className="border-2 border-dark-900" />
                 ))}
                 <div className="w-10 h-10 rounded-full bg-dark-700 border-2 border-dark-900 flex items-center justify-center text-xs text-white font-bold">
                    +{teammates.length}
                 </div>
            </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {teammates.map(tm => (
                <div key={tm.userId} className="bg-dark-800/60 p-3 rounded-xl min-w-[120px] flex flex-col items-center border border-white/5 relative">
                    <Avatar src={tm.avatar} size="w-10 h-10" />
                    <span className="text-xs font-bold text-zinc-300 mt-2 truncate max-w-full">{tm.name}</span>
                    <span className="text-[10px] text-zinc-500">减重 {tm.weightLost}kg</span>
                    {tm.status === 'success' ? (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-mint-500 rounded-full"></div>
                    ) : (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-zinc-700 rounded-full"></div>
                    )}
                </div>
            ))}
            {teammates.length === 0 && (
                <div className="text-zinc-500 text-xs flex items-center justify-center w-full py-2">
                    <div className="animate-pulse-slow">把暗号发给好友，等待加入...</div>
                </div>
            )}
        </div>

        <div className="flex-1 bg-dark-800/20 border border-white/5 rounded-2xl p-4 overflow-y-auto min-h-[300px] flex flex-col relative">
            {chatHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-2">
                    <Wifi className="w-8 h-8 opacity-20" />
                    <p className="text-sm">暂无消息，打个招呼吧！</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {chatHistory.map((msg, idx) => {
                        const isMe = msg.userId === user.userId;
                        const isSystem = msg.type === 'system';
                        if (isSystem) {
                            return (
                                <div key={idx} className="flex justify-center my-4">
                                    <span className="bg-white/10 text-zinc-300 text-[10px] px-3 py-1 rounded-full border border-white/5">
                                        {msg.content}
                                    </span>
                                </div>
                            );
                        }
                        return (
                            <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <Avatar src={msg.avatar || "?"} size="w-8 h-8" />
                                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-[10px] text-zinc-500">{msg.userName}</span>
                                    </div>
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-mint-500 text-dark-900 rounded-tr-none' : 'bg-dark-700 text-zinc-200 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={chatEndRef} />
                </div>
            )}
        </div>

        <div className="relative">
            <input 
                type="text" 
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                placeholder="发送消息..."
                className="w-full bg-dark-800 border border-dark-700 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-mint-500 transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMsg()}
            />
            <button 
                onClick={handleSendMsg}
                disabled={!msgInput.trim()}
                className="absolute right-1.5 top-1.5 p-2 bg-mint-500 text-dark-900 rounded-full hover:bg-mint-400 disabled:opacity-50 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
            >
                <Send className="w-4 h-4" />
            </button>
        </div>

        <button onClick={() => onUpdateUser({...user, teamId: undefined})} className="text-center text-xs text-zinc-600 hover:text-red-400 mt-2 flex items-center justify-center gap-1">
            <LogOut className="w-3 h-3" /> 退出队伍
        </button>
      </div>
    );
  };

  const ProfileView = () => {
    const handleSaveProfile = () => {
      onResetPlan({
        ...user,
        targetWeight: editTargetWeight,
        planWeeks: editPlanWeeks,
        route: editRecommendedRoute, 
      });
      setIsEditingTarget(false);
    };

    return (
      <div className="space-y-6 animate-fade-in pb-20">
         <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">我的档案</h2>
        </div>

        <div className="bg-dark-800/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Avatar src={user.avatar} size="w-16 h-16" className="text-4xl" />
              <div>
                <h3 className="font-bold text-white text-lg">{user.name}</h3>
                <div className="flex gap-2 text-xs text-zinc-400 mt-1">
                  <span>{user.gender === 'male' ? '男' : '女'}</span>
                  <span>{user.age}岁</span>
                  <span>{user.height}cm</span>
                </div>
              </div>
           </div>
           <button 
             onClick={() => {
                 setEditTargetWeight(user.targetWeight);
                 setEditPlanWeeks(planWeeks);
                 setIsEditingTarget(true);
             }}
             className="p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white border border-white/5"
           >
              <Edit2 className="w-5 h-5" />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="bg-dark-800/40 border border-white/5 p-4 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase font-bold mb-1">当前目标</p>
              <p className="text-2xl font-bold text-white">{user.targetWeight} <span className="text-sm font-normal text-zinc-500">kg</span></p>
           </div>
           <div className="bg-dark-800/40 border border-white/5 p-4 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase font-bold mb-1">当前计划</p>
              <p className={`text-lg font-bold ${currentRoute === 'aggressive' ? 'text-coral-400' : 'text-mint-400'}`}>
                {currentRoute === 'aggressive' ? '极限 (短周期)' : '平稳 (长周期)'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">总计 {planWeeks} 周</p>
           </div>
        </div>

        {!isStandalone && (installPrompt || isIOS) && (
            <div className="bg-gradient-to-r from-mint-900/20 to-dark-800 border border-mint-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <h4 className="text-mint-400 font-bold text-sm mb-1">安装 App 到手机</h4>
                    <p className="text-xs text-zinc-500">获得更好的全屏体验，不再输入网址</p>
                </div>
                <button 
                    onClick={handleInstallClick}
                    className="px-4 py-2 bg-mint-500 text-dark-900 rounded-lg text-xs font-bold hover:bg-mint-400 transition-colors"
                >
                    立即安装
                </button>
            </div>
        )}

        <div>
           <h3 className="font-bold text-zinc-200 mb-4 text-lg flex items-center gap-2">
             <History className="w-5 h-5" /> 历史记录
           </h3>
           <div className="space-y-2">
             {[...logs].reverse().map((log, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 bg-dark-800/20 border border-white/5 rounded-xl transition-colors hover:bg-dark-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-mint-500"></div>
                    <div className="flex flex-col">
                        <span className="text-zinc-300 font-mono text-sm">{log.date}</span>
                        {log.reflection && (
                            <span className="text-[10px] text-coral-400">{log.reflection}</span>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                      {log.photo && (
                          <button 
                            onClick={() => setViewingPhoto(log.photo!)}
                            className="p-1.5 bg-white/5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                          >
                             <Camera className="w-4 h-4" />
                          </button>
                      )}
                      <span className="text-white font-bold">{log.weight} kg</span>
                  </div>
               </div>
             ))}
             {logs.length === 0 && (
                <div className="text-center py-10 text-zinc-600 text-sm">暂无打卡记录</div>
             )}
           </div>
        </div>

        {isEditingTarget && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
             <div className="bg-dark-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6 animate-slide-up">
                <div className="flex items-center gap-2 text-coral-400">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">调整计划</h3>
                </div>
                
                <div className="bg-coral-500/10 border border-coral-500/20 p-3 rounded-xl text-xs text-coral-200 leading-relaxed">
                    ⚠️ <strong>注意：</strong> 修改目标或周期将重置您的当前进度，历史打卡记录将被清空，所有数据将以当前体重为起点重新计算。
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">新目标体重 (kg)</label>
                  <input 
                    type="number" 
                    value={editTargetWeight}
                    onChange={(e) => setEditTargetWeight(Number(e.target.value))}
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl p-3 text-white focus:border-mint-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-zinc-500 uppercase">新周期时长</label>
                    <span className="text-white font-bold">{editPlanWeeks} 周</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="24"
                    value={editPlanWeeks}
                    onChange={(e) => setEditPlanWeeks(Number(e.target.value))}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-mint-500"
                  />
                </div>

                <div className="bg-dark-800 p-3 rounded-xl border border-white/5">
                   <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-400">计划变动:</span>
                      <span className={editRecommendedRoute === 'aggressive' ? 'text-coral-400 font-bold' : 'text-mint-400 font-bold'}>
                        {editRecommendedRoute === 'aggressive' ? '切换至极限模式' : '切换至平稳模式'}
                      </span>
                   </div>
                   <p className="text-xs text-zinc-500">
                     App 将根据新的时长自动重新规划您的每日饮食和运动强度。
                   </p>
                </div>

                <div className="flex gap-3 pt-2">
                   <button onClick={() => setIsEditingTarget(false)} className="flex-1 py-3 rounded-xl font-bold text-zinc-400 hover:bg-white/5 transition-colors">取消</button>
                   <button onClick={handleSaveProfile} className="flex-1 py-3 rounded-xl bg-coral-600 text-white font-bold hover:bg-coral-500 transition-colors shadow-lg shadow-coral-500/20">重置并开始</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-950 text-zinc-100 font-sans">
      <div className="max-w-xl mx-auto min-h-screen relative flex flex-col bg-dark-950 border-x border-white/5 shadow-2xl">
        
        <main className="flex-1 p-6 overflow-y-auto">
           {activeTab === 'home' && <HomeView />}
           {activeTab === 'plan' && <PlanView />}
           {activeTab === 'social' && <SocialView />}
           {activeTab === 'me' && <ProfileView />}
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-40">
           {tutorialStep === 2 && (
             <>
                 <div className="fixed inset-0 bg-black/80 z-40 backdrop-blur-[2px]" onClick={completeTutorial}></div>
                 <div className="absolute bottom-full left-0 right-0 mb-4 z-50 animate-fade-in flex justify-center px-6">
                      <div className="bg-mint-500 text-zinc-900 p-5 rounded-2xl shadow-[0_0_50px_rgba(52,211,153,0.3)] w-full max-w-sm text-center relative">
                         <h4 className="font-black text-lg mb-1">🗺️ 更多功能</h4>
                         <p className="text-sm font-medium mb-4 leading-relaxed">底部导航栏可以查看每日食谱计划，<br/>或者去小分队和队友互动哦！</p>
                         <button onClick={completeTutorial} className="bg-zinc-900 text-mint-500 px-8 py-2 rounded-full text-xs font-bold shadow-lg transform hover:scale-105 transition-all">开启旅程 🚀</button>
                         <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-mint-500 rotate-45"></div>
                      </div>
                 </div>
             </>
           )}

           <div className="max-w-xl mx-auto bg-dark-900/90 backdrop-blur-lg border-t border-white/5 px-6 py-4 flex justify-between items-center pb-8 sm:pb-4 relative z-50">
              <button 
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-mint-400 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                 <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">首页</span>
              </button>
              <button 
                onClick={() => setActiveTab('plan')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'plan' ? 'text-mint-400 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                 <Calendar className="w-6 h-6" strokeWidth={activeTab === 'plan' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">计划</span>
              </button>
              <button 
                onClick={() => setActiveTab('social')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'social' ? 'text-mint-400 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                 <Users className="w-6 h-6" strokeWidth={activeTab === 'social' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">小分队</span>
              </button>
              <button 
                onClick={() => setActiveTab('me')}
                className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'me' ? 'text-mint-400 scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                 <User className="w-6 h-6" strokeWidth={activeTab === 'me' ? 2.5 : 2} />
                 <span className="text-[10px] font-bold">我的</span>
              </button>
           </div>
        </div>

        {isCheckInOpen && (
          <CheckInModal 
              onClose={() => setIsCheckInOpen(false)} 
              onSubmit={(w, p, r) => {
                const allowedDeviation = 0.5;
                if (w > todayTarget + allowedDeviation) {
                    onPenalty(50);
                }
                onCheckIn(w, p, r);
                setIsCheckInOpen(false);
              }}
              todayTarget={todayTarget}
              yesterdayWeight={logs.length > 0 ? logs[logs.length-1].weight : user.startWeight}
          />
        )}

        {isShareOpen && (
            <ShareModal 
              user={user} 
              daysPassed={daysPassed}
              onClose={() => setIsShareOpen(false)} 
            />
        )}

        {viewingPhoto && (
            <div 
                className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setViewingPhoto(null)}
            >
                <button className="absolute top-6 right-6 text-white bg-black/50 p-2 rounded-full">
                    <X className="w-6 h-6" />
                </button>
                <img 
                    src={viewingPhoto} 
                    alt="Check-in Record" 
                    className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                />
            </div>
        )}

        {showIOSInstall && (
            <div className="fixed inset-0 bg-black/90 z-[80] flex items-end sm:items-center justify-center backdrop-blur-sm animate-fade-in" onClick={() => setShowIOSInstall(false)}>
                <div className="bg-dark-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-8 pb-10 border border-white/10 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                     <button onClick={() => setShowIOSInstall(false)} className="absolute top-4 right-4 text-zinc-500">
                        <X className="w-6 h-6" />
                     </button>
                     <div className="text-center mb-6">
                        <Smartphone className="w-12 h-12 text-mint-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">在 iPhone 上安装</h3>
                        <p className="text-zinc-400 text-sm">安装后体验全屏模式，无需每次打开浏览器。</p>
                     </div>
                     <div className="space-y-4 text-sm text-zinc-300">
                         <div className="flex items-center gap-4 bg-dark-800 p-3 rounded-xl">
                            <span className="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded-full font-bold text-xs shrink-0">1</span>
                            <span>点击底部工具栏的 <Share2 className="w-4 h-4 inline mx-1" /> 分享按钮</span>
                         </div>
                         <div className="flex items-center gap-4 bg-dark-800 p-3 rounded-xl">
                            <span className="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded-full font-bold text-xs shrink-0">2</span>
                            <span>向下滑动，找到 <span className="font-bold text-white">"添加到主屏幕"</span></span>
                         </div>
                         <div className="flex items-center gap-4 bg-dark-800 p-3 rounded-xl">
                            <span className="w-6 h-6 flex items-center justify-center bg-zinc-700 rounded-full font-bold text-xs shrink-0">3</span>
                            <span>点击右上角的 <span className="font-bold text-white">"添加"</span> 即可</span>
                         </div>
                     </div>
                     <div className="mt-6 flex justify-center">
                         <div className="animate-bounce">
                             <ArrowDown className="w-6 h-6 text-zinc-500" />
                         </div>
                     </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
