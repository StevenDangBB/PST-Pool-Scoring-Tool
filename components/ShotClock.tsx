
import React from 'react';
import type { ShotClockState } from '../types';
import Icon from './Icon';

interface ShotClockProps {
    state: ShotClockState;
    isHost: boolean;
    onControl: (action: 'START' | 'STOP' | 'RESET' | 'EXT' | 'SET_TIME', value?: number) => void;
}

const ShotClock: React.FC<ShotClockProps> = ({ state, isHost, onControl }) => {
    const { seconds, initialSeconds, isRunning } = state;
    
    // State Logic
    const isWarning = seconds <= 10 && seconds > 5;
    const isDanger = seconds <= 5;

    // Dynamic Styles based on state
    let containerClass = "border-t border-white/10 bg-black/40"; // Default Glass Dark
    let progressClass = "from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.6)]";
    let textClass = "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]";
    let buttonClass = "bg-white/10 hover:bg-white/20 text-white border border-white/10";

    if (isDanger) {
        containerClass = "border-t border-red-500/50 bg-red-900/30 shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-pulse-fast";
        progressClass = "from-red-500 to-pink-600 shadow-[0_0_40px_rgba(239,68,68,0.8)]";
        textClass = "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)] scale-110";
        buttonClass = "bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30";
    } else if (isWarning) {
        containerClass = "border-t border-amber-500/30 bg-amber-900/20";
        progressClass = "from-amber-400 to-orange-500 shadow-[0_0_30px_rgba(245,158,11,0.6)]";
        textClass = "text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]";
        buttonClass = "bg-amber-500/10 hover:bg-amber-500/30 text-amber-200 border border-amber-500/20";
    }

    const percentage = Math.min(100, (seconds / initialSeconds) * 100);

    return (
        <div className={`fixed bottom-0 left-0 right-0 h-16 z-[100] flex items-center justify-between px-2 md:px-4 backdrop-blur-xl transition-all duration-300 overflow-hidden ${containerClass}`}>
            
            {/* Liquid Background Effect (Subtle glow behind everything) */}
            <div className={`absolute inset-0 opacity-20 bg-gradient-to-t ${isDanger ? 'from-red-900 via-transparent' : 'from-blue-900 via-transparent'} to-transparent pointer-events-none`} />

            {/* The Liquid Progress Bar */}
            <div 
                className={`absolute left-0 bottom-0 h-1.5 transition-all duration-1000 ease-linear bg-gradient-to-r ${progressClass}`} 
                style={{ width: `${percentage}%` }} 
            >
                {/* Glow bloom extending upwards */}
                <div className={`absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t ${isDanger ? 'from-red-600/30' : (isWarning ? 'from-amber-500/30' : 'from-cyan-500/30')} to-transparent opacity-50`} />
            </div>

            {/* Left Controls (Host Only) - Floating Glass Pills */}
            <div className="relative z-10 flex gap-2">
                {isHost && (
                    <>
                        <button onClick={() => onControl(isRunning ? 'STOP' : 'START')} className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-lg ${buttonClass}`}>
                            <Icon name={isRunning ? "pause" : "play"} size={20} fill="currentColor" />
                        </button>
                        <button onClick={() => onControl('RESET')} className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-lg ${buttonClass}`}>
                            <Icon name="refresh" size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Center Time Display - Neon Digital */}
            <div className="relative z-10 flex items-center justify-center gap-4">
                 <div className={`text-5xl font-black font-mono leading-none tracking-tighter transition-all duration-200 select-none ${textClass} w-[80px] text-center`}>
                    {seconds < 10 ? `0${seconds}` : seconds}
                 </div>
                 
                 {/* Quick Set Pills - Visible */}
                 {isHost && (
                     <div className="flex flex-col gap-1">
                         <button onClick={() => onControl('SET_TIME', 30)} className={`text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md border border-white/10 transition-colors ${initialSeconds === 30 ? 'bg-white text-black shadow-glow' : 'bg-black/40 text-white/70 hover:bg-white/20'}`}>30s</button>
                         <button onClick={() => onControl('SET_TIME', 60)} className={`text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md border border-white/10 transition-colors ${initialSeconds === 60 ? 'bg-white text-black shadow-glow' : 'bg-black/40 text-white/70 hover:bg-white/20'}`}>60s</button>
                     </div>
                 )}
            </div>

            {/* Right Controls (Extension) */}
            <div className="relative z-10 flex gap-2">
                {isHost && (
                    <button 
                        onClick={() => onControl('EXT')} 
                        className="h-10 px-4 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-700 hover:from-fuchsia-500 hover:to-purple-600 flex items-center justify-center text-white font-black uppercase tracking-widest shadow-[0_0_15px_rgba(192,38,211,0.5)] active:scale-95 transition-all border border-white/20"
                    >
                        <span className="text-sm">EXT</span>
                    </button>
                )}
            </div>
            
            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
            
            <style>{`
                @keyframes pulse-fast {
                    0%, 100% { box-shadow: 0 0 50px rgba(220,38,38,0.4) inset; }
                    50% { box-shadow: 0 0 80px rgba(220,38,38,0.7) inset; }
                }
                .animate-pulse-fast {
                    animation: pulse-fast 1s infinite cubic-bezier(0.4, 0, 0.6, 1);
                }
            `}</style>
        </div>
    );
};

export default ShotClock;
