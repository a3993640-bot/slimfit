
import React, { useState } from 'react';
import { UserProfile, RouteType } from '../types';
import { calculateBMI, getBMIStatus, compressImage } from '../utils';
import { Activity, Coffee, Camera, Upload } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    coins: 1000,
    startDate: new Date().toISOString(), // Will be normalized to midnight later but good for now
    avatar: '', 
    gender: 'female',
    planWeeks: 8, // Default 8 weeks
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Compress avatar to 300px width max
        const compressed = await compressImage(reader.result as string, 300, 0.7);
        setFormData(prev => ({ ...prev, avatar: compressed }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(p => p + 1);

  // --- Computed Logic for Plan ---
  const currentW = formData.currentWeight || 0;
  const targetW = formData.targetWeight || 0;
  const totalLoss = currentW - targetW;
  const weeks = formData.planWeeks || 1;
  const weeklyLoss = totalLoss / weeks;

  // Determine difficulty and route based on sliding math
  let difficultyColor = 'text-mint-400';
  let difficultyLabel = '轻松';
  let recommendedRoute: RouteType = 'gentle';

  if (weeklyLoss > 1.2) {
    difficultyColor = 'text-coral-500';
    difficultyLabel = '极度危险';
    recommendedRoute = 'aggressive';
  } else if (weeklyLoss > 0.8) {
    difficultyColor = 'text-orange-400';
    difficultyLabel = '困难';
    recommendedRoute = 'aggressive';
  } else if (weeklyLoss > 0.5) {
    difficultyColor = 'text-yellow-400';
    difficultyLabel = '中等';
    recommendedRoute = 'gentle'; // Can be aggressive too, but gentle is safer
  } else {
    difficultyColor = 'text-mint-400';
    difficultyLabel = '平缓';
    recommendedRoute = 'gentle';
  }

  const handleComplete = () => {
    const start = new Date();
    // Normalize start date to midnight to ensure Day 0 logic works across timezones/times
    start.setHours(0,0,0,0);
    
    onComplete({
      ...formData as UserProfile,
      startDate: start.toISOString(),
      startWeight: formData.currentWeight!,
      route: recommendedRoute, // Auto-assign based on slider, or could let user override
    });
  };

  const renderStep1_Profile = () => (
    <div className="space-y-6 animate-fade-in w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">建立档案</h2>
        <p className="text-zinc-400 mt-2">上传你的头像</p>
      </div>

      <div className="flex justify-center mb-6">
        <label className="relative group cursor-pointer">
          <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${formData.avatar ? 'border-mint-500 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-zinc-700 bg-dark-800'}`}>
             {formData.avatar ? (
               <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
               <div className="text-zinc-500 flex flex-col items-center gap-2 group-hover:text-mint-400">
                 <Camera className="w-8 h-8" />
                 <span className="text-xs font-bold">点击上传</span>
               </div>
             )}
          </div>
          <div className="absolute bottom-0 right-0 bg-mint-500 p-2 rounded-full text-dark-950 shadow-lg">
             <Upload className="w-4 h-4" />
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">性别</label>
          <div className="flex bg-dark-800 rounded-xl p-1 border border-dark-700">
            {['female', 'male'].map((g) => (
              <button
                key={g}
                onClick={() => handleChange('gender', g)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === g ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500'}`}
              >
                {g === 'female' ? '女' : '男'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
           <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">年龄</label>
           <input 
            type="number" 
            className="w-full p-3 bg-dark-800 rounded-xl border border-dark-700 text-white focus:ring-2 focus:ring-mint-500 focus:border-transparent outline-none transition-all"
            placeholder="25"
            onChange={e => handleChange('age', Number(e.target.value))}
           />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">身高 (cm)</label>
        <input 
          type="number" 
          className="w-full p-3 bg-dark-800 rounded-xl border border-dark-700 text-white focus:ring-2 focus:ring-mint-500 focus:border-transparent outline-none transition-all"
          placeholder="165"
          onChange={e => handleChange('height', Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">当前体重 (kg)</label>
        <input 
          type="number" 
          className="w-full p-3 bg-dark-800 rounded-xl border border-dark-700 text-white focus:ring-2 focus:ring-mint-500 focus:border-transparent outline-none transition-all"
          placeholder="60.5"
          onChange={e => handleChange('currentWeight', Number(e.target.value))}
        />
      </div>

      {formData.height && formData.currentWeight && (
        <div className="bg-dark-800/50 border border-zinc-700 p-4 rounded-xl flex items-center justify-between mt-4">
          <div>
            <span className="text-xs text-zinc-500 block">BMI 指数</span>
            <span className="text-2xl font-bold text-white">
              {calculateBMI(formData.currentWeight, formData.height)}
            </span>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold bg-dark-900 border border-zinc-600 ${getBMIStatus(calculateBMI(formData.currentWeight, formData.height)).color}`}>
            {getBMIStatus(calculateBMI(formData.currentWeight, formData.height)).label}
          </div>
        </div>
      )}

      <button 
        disabled={!formData.currentWeight || !formData.height || !formData.avatar}
        onClick={nextStep}
        className="w-full bg-mint-500 hover:bg-mint-400 text-dark-900 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-mint-500/20 disabled:opacity-30 disabled:shadow-none mt-6 transition-all"
      >
        下一步
      </button>
    </div>
  );

  const renderStep2_Target = () => (
    <div className="space-y-6 animate-fade-in w-full">
       <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">定制计划</h2>
        <p className="text-zinc-400 mt-2">设定目标，掌控节奏</p>
      </div>

      {/* Target Weight Input */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">目标体重 (kg)</label>
        <div className="relative">
             <input 
              type="number" 
              className="w-full p-4 bg-dark-800 rounded-xl border border-dark-700 text-4xl font-bold text-center text-white focus:ring-2 focus:ring-mint-500 focus:border-transparent outline-none tabular-nums"
              placeholder="50.0"
              onChange={e => handleChange('targetWeight', Number(e.target.value))}
            />
            {formData.targetWeight && currentW > formData.targetWeight && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-mint-500 text-sm font-bold">
                    -{ (currentW - formData.targetWeight).toFixed(1) } kg
                </div>
            )}
        </div>
      </div>
      
      {formData.targetWeight && formData.targetWeight < currentW && (
        <div className="space-y-6 mt-8 animate-slide-up">
          
          {/* Duration Slider */}
          <div className="bg-dark-800/40 p-5 rounded-2xl border border-white/5">
             <div className="flex justify-between items-end mb-4">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">减重周期</label>
                <div className="text-right">
                    <span className="text-2xl font-bold text-white tabular-nums">{formData.planWeeks}</span>
                    <span className="text-sm text-zinc-500 ml-1">周</span>
                </div>
             </div>
             <input 
                type="range" 
                min="1" 
                max="24" 
                value={formData.planWeeks}
                onChange={(e) => handleChange('planWeeks', Number(e.target.value))}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-mint-500 hover:accent-mint-400"
             />
             <div className="flex justify-between text-[10px] text-zinc-600 mt-2 uppercase font-bold">
                <span>1周 (极速)</span>
                <span>24周 (半年)</span>
             </div>
          </div>

          {/* Analysis Card */}
          <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-zinc-400">每周需减重</span>
                  <span className={`text-xl font-bold tabular-nums ${difficultyColor}`}>
                      {weeklyLoss.toFixed(2)} kg
                  </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-zinc-400">难度系数</span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded bg-white/5 ${difficultyColor}`}>
                      {difficultyLabel}
                  </span>
              </div>
              
              <div className="h-px w-full bg-white/5 my-3"></div>

              {/* Recommended Plan */}
              <div className="flex items-start gap-3">
                 <div className={`mt-1 ${recommendedRoute === 'aggressive' ? 'text-coral-500' : 'text-mint-500'}`}>
                    {recommendedRoute === 'aggressive' ? <Activity className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                 </div>
                 <div>
                    <div className="text-sm font-bold text-white mb-0.5">
                        推荐: {recommendedRoute === 'aggressive' ? '极限冲刺计划' : '平稳减脂计划'}
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        {recommendedRoute === 'aggressive' 
                            ? '包含液断、低碳饮食及高强度HIIT训练。适合短期突击，挑战性大。' 
                            : '均衡饮食，碳水循环，搭配有氧运动。适合长期坚持，不易反弹。'}
                    </p>
                 </div>
              </div>
          </div>

          <button 
            onClick={handleComplete}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]
                ${weeklyLoss > 1.5 
                    ? 'bg-coral-900 text-coral-200 border border-coral-700 hover:bg-coral-800' // Warning state
                    : 'bg-mint-500 hover:bg-mint-400 text-dark-900 shadow-mint-500/20'}
            `}
          >
            {weeklyLoss > 1.5 ? '确认挑战 (注意安全)' : '生成我的计划'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-950 p-6 flex flex-col justify-center items-center max-w-md mx-auto">
      {step === 1 ? renderStep1_Profile() : renderStep2_Target()}
    </div>
  );
};
