
import React from 'react';
import type { GameData, PlayerColor, Player } from '../types';
import Icon from './Icon';
import OneVsOneCard from './OneVsOneCard';
import TeamPlayerCard from './TeamPlayerCard';

interface ScoreBoardProps {
    gameData: GameData;
    handleUpdate: (data: GameData) => void;
    updateScore: (mode: '1vs1' | 'den', id: number, delta: number) => void;
    editName: (mode: '1vs1' | 'den', id: number, newName: string) => void;
    addPlayerDen: () => void;
    removePlayerDen: (id: number) => void;
    autoBalance: (id: number) => void;
    movePlayer: (index: number, direction: 1 | -1) => void;
    winner: string | null;
    isFocusMode: boolean;
    isManageMode: boolean;
    setIsManageMode: (v: boolean) => void;
    streak: { playerId: number | null; count: number };
    theme: string;
    playerColors: PlayerColor[];
    glassPanel: string;
    subPanel: string;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
    gameData, handleUpdate, updateScore, editName, addPlayerDen, removePlayerDen,
    autoBalance, movePlayer, winner, isFocusMode, isManageMode, setIsManageMode,
    streak, theme, playerColors, glassPanel, subPanel
}) => {
    
    // Effects Calculation
    const { players1vs1, raceTo } = gameData;
    const maxScore = players1vs1.length > 0 ? Math.max(...players1vs1.map(p => p.score)) : 0;
    const isHillHill = players1vs1.length === 2 && raceTo > 1 && players1vs1[0].score === raceTo - 1 && players1vs1[1].score === raceTo - 1;

    let raceToStyle: React.CSSProperties = {};
    let raceToClass = "";
    let raceToText = "Race To";

    if (isHillHill) {
        raceToClass = "hill-hill-effect z-10 relative";
        raceToText = "HILL HILL";
    } else {
        raceToClass = "race-to-heartbeat-dynamic z-10 relative";
        const progress = raceTo > 0 ? maxScore / raceTo : 0;
        const duration = Math.max(0.5, 1.5 - (progress * 1.0));
        const scale = 1.1 + (progress * 0.2);
        raceToStyle = { animationDuration: `${duration}s`, '--beat-scale': scale } as React.CSSProperties;
    }

    return (
        <div className="h-full flex flex-col space-y-2 text-center animate-fadeIn pb-20">
            <div className={`p-2 rounded-[2rem] flex flex-col items-center justify-center ${glassPanel} glass-effect border ${isFocusMode && gameData.gameMode !== 'den' ? 'border-none bg-transparent shadow-none' : ''}`}>
                {!isFocusMode && (
                    <div className={`flex p-1 rounded-2xl w-full max-w-[200px] ${subPanel}`}>
                        <button onClick={() => handleUpdate({...gameData, gameMode: '1vs1'})} className={`flex-1 py-2 rounded-xl flex justify-center transition-all duration-300 ${gameData.gameMode === '1vs1' ? 'bg-fuchsia-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}><Icon name="user" size={18} /></button>
                        <button onClick={() => handleUpdate({...gameData, gameMode: 'den'})} className={`flex-1 py-2 rounded-xl flex justify-center transition-all duration-300 ${gameData.gameMode === 'den' ? 'bg-fuchsia-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}><Icon name="users" size={18} /></button>
                    </div>
                )}
                {gameData.gameMode === '1vs1' ? (
                    isFocusMode ? (
                        <div className="flex flex-col items-center py-2 relative">
                            <span className={`text-[8rem] md:text-[12rem] leading-[0.8] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black italic tracking-tighter uppercase whitespace-nowrap pointer-events-none text-scanlines z-0 ${isHillHill ? 'text-red-500/30' : (theme === 'dark' ? 'text-white/20' : 'text-slate-300')}`} style={{fontSize: '15vw'}}>{raceToText}</span>
                            <span className={`text-[6rem] md:text-[8rem] leading-[0.85] font-black text-white drop-shadow-2xl transition-all duration-300 z-10 ${raceToClass}`} style={raceToStyle}>{gameData.raceTo}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 mt-2">
                            <span className="text-[10px] font-black uppercase opacity-40">Race To</span>
                            <div className="flex items-center gap-10">
                                <button onClick={() => handleUpdate({...gameData, raceTo: Math.max(1, gameData.raceTo - 1)})} className={`w-10 h-10 rounded-xl flex items-center justify-center ${subPanel} hover:bg-slate-100 dark:hover:bg-white/10`}><Icon name="minus" size={18} /></button>
                                <span className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white drop-shadow-md race-effect-normal">{gameData.raceTo}</span>
                                <button onClick={() => handleUpdate({...gameData, raceTo: gameData.raceTo + 1})} className={`w-10 h-10 rounded-xl flex items-center justify-center ${subPanel} hover:bg-slate-100 dark:hover:bg-white/10`}><Icon name="plus" size={18} /></button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-4 w-full justify-between px-2 mt-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${ (gameData.playersDen.reduce((acc, p) => acc + p.score, 0)) === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-xs font-black uppercase transition-colors duration-500 ${ (gameData.playersDen.reduce((acc, p) => acc + p.score, 0)) === 0 ? 'text-green-500' : 'text-red-500'}`}>{ (gameData.playersDen.reduce((acc, p) => acc + p.score, 0)) === 0 ? 'BALANCED' : `DIFF: ${gameData.playersDen.reduce((acc, p) => acc + p.score, 0)}`}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsManageMode(!isManageMode)} className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isManageMode ? 'bg-amber-500 text-white' : 'bg-white/20 dark:bg-black/40 text-slate-400'}`}><Icon name="pencil" size={18} /></button>
                            <button onClick={addPlayerDen} className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-lg hover:bg-cyan-500 transition-colors"><Icon name="userPlus" size={20} /></button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Player Cards Area */}
            <div className={`flex-1 flex flex-col justify-center gap-2 pb-0 pr-1 min-h-0 ${gameData.gameMode === '1vs1' ? 'overflow-visible px-2' : 'overflow-y-auto'}`}>
                <div className={`${gameData.gameMode === '1vs1' ? 'grid grid-cols-2 gap-4 h-full' : 'flex flex-col gap-2'}`}>
                    {gameData.gameMode === '1vs1' ? (
                        gameData.players1vs1.map((p, idx) => (
                            <OneVsOneCard 
                                key={p.id} 
                                player={p} 
                                color={playerColors[p.colorIdx]} 
                                gameData={gameData} 
                                updateScore={updateScore} 
                                editName={editName} 
                                winner={winner} 
                                isFocusMode={isFocusMode} 
                                isFever={streak.playerId === p.id && streak.count >= 3} 
                            />
                        ))
                    ) : (
                        gameData.playersDen.map((p, idx) => (
                            <TeamPlayerCard 
                                key={p.id} 
                                player={p} 
                                index={idx} 
                                gameData={gameData} 
                                updateScore={updateScore} 
                                editName={editName} 
                                autoBalance={autoBalance} 
                                removePlayerDen={removePlayerDen} 
                                color={playerColors[p.colorIdx]} 
                                isManageMode={isManageMode} 
                                movePlayer={movePlayer} 
                                isFever={streak.playerId === p.id && streak.count >= 3} 
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default React.memo(ScoreBoard);
