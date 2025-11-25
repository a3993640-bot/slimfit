
import React, { useState } from 'react';
import { X, Camera, ArrowDown, ArrowUp, AlertCircle, Utensils, BedDouble, Droplets, Activity } from 'lucide-react';
import { compressImage } from '../utils';

interface CheckInModalProps {
  onClose: () => void;
  onSubmit: (weight: number, photo?: string, reflection?: string) => void;
  todayTarget: number;
  yesterdayWeight: number;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({ onClose, onSubmit, todayTarget, yesterdayWeight }) => {
  const [step, setStep] = useState<'input' | 'reflection'>('input');
  const [weight, setWeight] = useState<string>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string>('');

  const numWeight = parseFloat(weight);
  const diff = numWeight ? numWeight - yesterdayWeight : 0;
  
  // Logic: Trigger reflection if weight > target + 0.2kg OR weight > yesterday
  const needsReflection = numWeight && (numWeight > todayTarget + 0.2 || diff > 0.2);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 0.6);
        setPhoto(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (!numWeight) return;
    if (needsReflection && step === 'input') {
        setStep('reflection');
    } else {
        onSubmit(numWeight, photo || undefined, reflection);
    }
  };

  // Reflection Options
  const reasons = [
      { id: 'overate', label: '没忍住吃多了', icon: <Utensils className="w-5 h-5"/> },
      { id: 'no_exercise', label: '太忙没运动', icon: <Activity className="w-5 h-5"/> },
      { id: 'water', label: '水肿/便秘', icon: <Droplets className="w-5 h-5"/> },
      { id: 'period', label: '生理期波动', icon: <AlertCircle className="w-5 h-5"/> },
      { id: 'rest', label: '正常休息日', icon: <BedDouble className="w-5 h-5"/> },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-8 relative animate-slide-up border border-white/10 shadow-2xl mx-auto overflow-hidden">
        
        {/* Step 1: Input */}
        {step === 'input' && (
            <>
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
                
                <h2 className="text-2xl font-bold text-white mb-2 text-center">今日打卡</h2>
                <p className="text-zinc-500 text-xs text-center mb-8 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" /> 建议早晨起床空腹称重，数据更准哦
                </p>
                
                {/* Weight Input */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center relative">
                        <input 
                            type="number" 
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="text-7xl font-black text-white text-center w-full bg-transparent border-none outline-none focus:ring-0 placeholder-zinc-800 tracking-tighter"
                            placeholder="0.0"
                            autoFocus
                        />
                    </div>
                    {weight && (
                        <div className={`mt-4 text-sm font-bold flex items-center justify-center gap-2 bg-dark-800 inline-flex px-4 py-2 rounded-full border border-white/5 ${diff <= 0 ? 'text-mint-400' : 'text-coral-400'}`}>
                            {diff <= 0 ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                            <span>{diff <= 0 ? '下降' : '上升'} {Math.abs(diff).toFixed(1)} kg</span>
                        </div>
                    )}
                    <p className="text-xs text-zinc-600 mt-4 font-medium">今日目标: ≤ {todayTarget.toFixed(1)} kg</p>
                </div>

                {/* Photo Upload Area */}
                <div className="mb-8">
                    <label className="block w-full h-24 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-mint-500/50 hover:bg-zinc-800/30 transition-all flex flex-row items-center justify-center gap-3 cursor-pointer bg-dark-800/20 relative overflow-hidden group">
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        {photo ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <img src={photo} alt="Preview" className="h-full object-cover rounded-lg" />
                                <span className="absolute bottom-1 bg-black/50 text-white text-xs px-2 rounded backdrop-blur">点击更换</span>
                            </div>
                        ) : (
                            <>
                                <div className="bg-dark-800 p-2 rounded-full text-zinc-500 group-hover:text-mint-400 transition-all border border-white/5">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <span className="text-zinc-500 text-sm font-medium">拍摄/上传记录 (可选)</span>
                            </>
                        )}
                    </label>
                </div>

                <button 
                    disabled={!weight}
                    onClick={handleNext}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                >
                    {needsReflection ? '下一步' : '确认打卡'}
                </button>
            </>
        )}

        {/* Step 2: Reflection */}
        {step === 'reflection' && (
            <div className="animate-fade-in">
                <button onClick={() => setStep('input')} className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors text-sm font-bold">
                    返回
                </button>
                <div className="text-center mt-4 mb-6">
                    <div className="w-16 h-16 bg-coral-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-coral-500">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">数据有点波动?</h2>
                    <p className="text-zinc-400 text-sm px-4">别担心，这是正常的。记录一下可能的原因，App 会帮你调整建议。</p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-8 max-h-[40vh] overflow-y-auto">
                    {reasons.map((r) => (
                        <button 
                            key={r.id}
                            onClick={() => setReflection(r.label)}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                                reflection === r.label 
                                ? 'bg-mint-500 text-dark-900 border-mint-500' 
                                : 'bg-dark-800 text-zinc-300 border-transparent hover:bg-dark-700'
                            }`}
                        >
                            <div className={`${reflection === r.label ? 'text-dark-900' : 'text-zinc-500'}`}>{r.icon}</div>
                            <span className="font-bold text-sm">{r.label}</span>
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => onSubmit(numWeight, photo || undefined, reflection)}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                >
                    记录并完成
                </button>
            </div>
        )}

      </div>
    </div>
  );
};
