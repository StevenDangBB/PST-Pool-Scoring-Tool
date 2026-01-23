
import React, { useState } from 'react';
import type { Player, PlayerColor, GameData } from '../types';
import Icon from './Icon';
import PlayerWatermark from './PlayerWatermark';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText: string;
    iconName: string;
    theme: 'danger' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, description, confirmText, iconName, theme }) => {
    if (!isOpen) return null;

    const themeClasses = {
        danger: {
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-500',
            btn: 'bg-red-500 text-white shadow-lg shadow-red-500/30'
        },
        info: {
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-500',
            btn: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl">
                <div className={`w-16 h-16 ${themeClasses[theme].bg} ${themeClasses[theme].text} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon name={iconName} size={32} />
                </div>
                <h3 className="text-xl font-black mb-2 dark:text-white">{title}</h3>
                <div className="text-sm text-slate-500 mb-6">{description}</div>
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-xl">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 font-bold rounded-xl ${themeClasses[theme].btn}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
}

interface TeamPlayerCardProps {
    player: Player;
    index: number;
    updateScore: (mode: 'den', id: number, delta: number) => void;
    editName: (mode: 'den', id: number, newName: string) => void;
    autoBalance: (id: number) => void;
    removePlayerDen: (id: number) => void;
    color: PlayerColor;
    isManageMode: boolean;
    movePlayer: (index: number, direction: 1 | -1) => void;
    gameData: GameData;
    isFever: boolean;
}

const TeamPlayerCard: React.FC<TeamPlayerCardProps> = ({ player, index, updateScore, editName, autoBalance, removePlayerDen, color, isManageMode, movePlayer, gameData, isFever }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBalanceConfirm, setShowBalanceConfirm] = useState(false);

    const currentTotal = gameData.playersDen.reduce((acc, p) => acc + p.score, 0);
    const adjustment = -currentTotal;
    const newScore = player.score + adjustment;
    
    const scores = gameData.playersDen.map(p => p.score);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    
    const isImbalanced = currentTotal !== 0;
    const isHighest = isImbalanced && player.score === maxScore && player.score > 0;
    const isLowest = isImbalanced && player.score === minScore && player.score < 0;

    let statusClass = "";
    let statusIcon = null;
    
    if (isFever) {
        statusClass = "card-fever";
    } else if (isHighest) {
        statusClass = "card-winner border-amber-400";
        statusIcon = <div className="text-amber-500 animate-bounce flex-none"><Icon name="crown" size={20} fill="currentColor" /></div>;
    } else if (isLowest) {
        statusClass = "card-danger border-red-500";
        statusIcon = <div className="text-red-500 animate-pulse flex-none"><Icon name="alert" size={20} /></div>;
    }

    return (
        <>
            <ConfirmationModal 
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => { removePlayerDen(player.id); setShowDeleteConfirm(false); }}
                title={`Delete ${player.name}?`}
                description="This action cannot be undone."
                confirmText="Delete"
                iconName="trash"
                theme="danger"
            />
            <ConfirmationModal
                isOpen={showBalanceConfirm}
                onClose={() => setShowBalanceConfirm(false)}
                onConfirm={() => { autoBalance(player.id); setShowBalanceConfirm(false); }}
                title="Auto Balance?"
                description={<p>Adjust <strong>{player.name}</strong> from <strong className="text-slate-800 dark:text-slate-200">{player.score}</strong> to <strong className="text-blue-600">{newScore}</strong>?</p>}
                confirmText="Confirm"
                iconName="calc"
                theme="info"
            />

            <div className={`relative flex-1 min-h-[80px] flex flex-col px-3 py-2 rounded-[2rem] border overflow-hidden transition-all duration-500 ${color.card} ${statusClass}`}>
                <PlayerWatermark name={player.name} colorClass={color.watermark} />
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color.bar}`}></div>
                
                <div className="relative z-10 flex items-center h-full w-full gap-2 mt-0">
                    {isManageMode ? (
                        <button onClick={() => movePlayer(index, 1)} className="w-10 h-10 flex-none rounded-full flex items-center justify-center bg-white/40 dark:bg-black/20 text-slate-500 active:scale-90 transition-all backdrop-blur-sm">
                            <Icon name="chevronDown" size={20} />
                        </button>
                    ) : (
                        <button onClick={() => updateScore('den', player.id, -1)} className={`rounded-full flex-none w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-transparent text-slate-500 ${color.btn} active:scale-90 transition-all`}>
                            <Icon name="chevronLeft" size={24} className="md:w-7 md:h-7" />
                        </button>
                    )}

                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden w-full h-full">
                        <div className="relative flex items-center justify-center w-full pl-2">
                            {!isManageMode && statusIcon && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                                    {statusIcon}
                                </div>
                            )}
                            <input type="text" value={player.name} onChange={(e) => editName('den', player.id, e.target.value)} className="text-center bg-transparent font-black uppercase text-lg md:text-xl opacity-80 focus:opacity-100 focus:outline-none truncate w-full px-1" placeholder="NAME"/>
                        </div>

                        <button 
                            onClick={() => { if (!isManageMode && currentTotal !== 0) setShowBalanceConfirm(true); }}
                            disabled={isManageMode}
                            className={`relative text-5xl md:text-6xl font-black tabular-nums transition-all leading-none ${isManageMode ? 'opacity-50' : 'active:scale-95'} ${player.score < 0 ? 'text-red-500' : player.score > 0 ? color.text.replace('text-', 'text-') : 'opacity-20'}`}
                        >
                            <span className="inline-block relative">
                                {player.score < 0 && <span className="absolute right-full mr-1 md:mr-2 opacity-100">-</span>}
                                {Math.abs(player.score)}
                            </span>
                        </button>
                    </div>

                    {isManageMode ? (
                        <div className="flex flex-col gap-1 md:gap-2">
                             <button onClick={() => setShowDeleteConfirm(true)} className="w-10 h-10 flex-none rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-500 active:scale-90 transition-all backdrop-blur-sm">
                                <Icon name="trash" size={18} />
                            </button>
                             <button onClick={() => movePlayer(index, -1)} className="w-10 h-10 flex-none rounded-full flex items-center justify-center bg-white/40 dark:bg-black/20 text-slate-500 active:scale-90 transition-all backdrop-blur-sm">
                                <Icon name="chevronUp" size={20} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => updateScore('den', player.id, 1)} className={`rounded-full flex-none w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-transparent text-slate-500 ${color.btn} active:scale-90 transition-all`}>
                            <Icon name="chevronRight" size={24} className="md:w-7 md:h-7" />
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default TeamPlayerCard;
