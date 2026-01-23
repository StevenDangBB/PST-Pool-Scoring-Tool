
import React from 'react';
import type { Player, PlayerColor, GameData } from '../types';
import Icon from './Icon';
import PlayerWatermark from './PlayerWatermark';

interface OneVsOneCardProps {
    player: Player;
    color: PlayerColor;
    gameData: GameData;
    updateScore: (mode: '1vs1', id: number, delta: number) => void;
    editName: (mode: '1vs1', id: number, newName: string) => void;
    toggleBreak: () => void;
    winner: string | null;
    isFocusMode: boolean;
    isFever: boolean;
    isLocked: boolean;
}

const OneVsOneCard: React.FC<OneVsOneCardProps> = ({ 
    player, color, gameData, updateScore, editName, toggleBreak, 
    winner, isFocusMode, isFever, isLocked 
}) => {
    const otherPlayerScore = gameData.players1vs1.find(p => p.id !== player.id)?.score || 0;
    const isLeader = player.score > otherPlayerScore && player.score > 0;
    const isWinner = winner === player.name;
    const isLoser = winner && winner !== player.name;
    
    // Break Token Check
    const hasBreak = gameData.breakPlayerId === player.id;

    // Leader effect class
    const leaderClass = (!isWinner && !isFever && isLeader) 
        ? 'ring-4 ring-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)] z-20' 
        : '';

    return (
        <div className={`relative flex flex-col h-full justify-center transition-all duration-500 ${isWinner ? 'z-30' : (isLoser ? 'loser-dimmed' : '')}`}>
            {isWinner && <div className="absolute inset-0 rounded-[2rem] winner-grand-card pointer-events-none"></div>}
            
            {isWinner && (
                <div className="grand-crown-container">
                    <div className="crown-halo"></div>
                    <div className="text-amber-400 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]"><Icon name="crown" size={60} fill="currentColor" /></div>
                    <div className="winner-badge">WINNER</div>
                </div>
            )}
            
            <div className={`relative flex-1 flex flex-col p-2 rounded-[2rem] overflow-hidden transition-all duration-300 ${color.card} ${isWinner ? 'bg-black/80' : 'border'} ${isFever ? 'card-fever' : ''} ${leaderClass}`}>
                <PlayerWatermark name={player.name} colorClass={color.watermark} />
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color.bar}`}></div>
                
                {/* Break Token - Moved to Bottom Left */}
                <button 
                    onClick={toggleBreak}
                    className={`absolute bottom-3 left-3 z-40 p-2 rounded-full transition-all duration-300 ${hasBreak ? 'bg-white text-black shadow-lg scale-100 opacity-100' : 'bg-white/10 text-white/20 scale-90 opacity-0 hover:opacity-50'}`}
                    disabled={isLocked}
                >
                    <Icon name="cue" size={20} />
                </button>

                <div className="flex flex-col h-full items-center py-1 w-full z-10">
                    <input 
                        type="text" 
                        value={player.name} 
                        onChange={(e) => editName('1vs1', player.id, e.target.value)} 
                        disabled={isLocked}
                        className={`text-center bg-transparent text-lg md:text-xl font-black uppercase tracking-tighter focus:outline-none w-full px-2 mb-1 truncate relative z-20 ${isWinner ? 'text-amber-400 drop-shadow-md' : 'opacity-80 focus:opacity-100'}`} 
                    />
                    <div className="flex-1 w-full flex flex-col items-center justify-center gap-1">
                        <button 
                            onClick={() => updateScore('1vs1', player.id, 1)} 
                            disabled={isLocked}
                            className={`w-full flex-1 rounded-xl flex items-center justify-center bg-transparent text-slate-500 ${color.btn} active:scale-95 transition-all ${isFocusMode ? 'opacity-30 hover:opacity-100' : ''} ${isLocked ? 'opacity-10 cursor-not-allowed' : ''}`}
                        >
                            <Icon name="chevronUp" size={32} />
                        </button>
                        <span className={`font-black tabular-nums tracking-tighter text-center py-1 text-6xl md:text-8xl ${isWinner ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 drop-shadow-lg' : color.text}`}>
                            {player.score}
                        </span>
                        <button 
                            onClick={() => updateScore('1vs1', player.id, -1)} 
                            disabled={isLocked}
                            className={`w-full flex-1 rounded-xl flex items-center justify-center bg-transparent text-slate-500 ${color.btn} active:scale-95 transition-all ${isFocusMode ? 'opacity-30 hover:opacity-100' : ''} ${isLocked ? 'opacity-10 cursor-not-allowed' : ''}`}
                        >
                            <Icon name="chevronDown" size={32} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(OneVsOneCard);