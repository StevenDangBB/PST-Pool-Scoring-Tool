
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { DEFAULT_GAME_DATA, getPlayerColors, SFX } from './constants';
import { generateRoomId, getCurrentTime, calculateBillingData } from './utils';
import type { GameData, Theme, HistoryEntry, Player, HistoryFilter } from './types';
import Icon from './components/Icon';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import BillingView from './components/BillingView';
import HistoryModal from './components/modals/HistoryModal';
import BaseModal from './components/modals/BaseModal';
import QRCodeModal from './components/modals/QRCodeModal';
import ReactionOverlay from './components/ReactionOverlay';
import ShotClock from './components/ShotClock'; // Import ShotClock
import { useGameSync } from './hooks/useGameSync';

const App: React.FC = () => {
    // State - Default Theme set to 'dark'
    const [theme, setTheme] = useState<Theme>('dark');
    const [activeView, setActiveView] = useState<'score' | 'bill'>('score');
    const [winner, setWinner] = useState<string | null>(null);
    const [lastSessionBackup, setLastSessionBackup] = useState<GameData | null>(null);
    const [showCopied, setShowCopied] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(true);
    const [isManageMode, setIsManageMode] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [streak, setStreak] = useState<{ playerId: number | null; count: number }>({ playerId: null, count: 0 });

    // Custom Hook for P2P Sync
    const { 
        sessionId, gameData, isOnline, isLoadingRoom, 
        syncing, permissionError, handleUpdate, isHost, peerCount,
        lastReaction, sendReaction, pendingCommand, setPendingCommand, sendCommand
    } = useGameSync();

    const playerColors = useMemo(() => getPlayerColors(theme), [theme]);
    
    // UI Classes
    const themeClasses = theme === 'dark' ? 'bg-[#0a0510] text-slate-100' : 'bg-slate-50 text-slate-900';
    const glassPanel = theme === 'dark' ? 'bg-white/[0.03] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]' : 'bg-white/70 border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)]';
    const subPanel = theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border border-slate-200';

    // Audio Refs
    const audioRef = useRef<HTMLAudioElement>(new Audio());

    const playSound = (type: 'CLICK' | 'WIN' | 'BUZZER' | 'TICK' | 'EXT') => {
        if(audioRef.current) {
            audioRef.current.src = SFX[type];
            audioRef.current.volume = type === 'TICK' ? 0.6 : 1.0;
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
    };

    // Handle Remote Commands from Viewers
    useEffect(() => {
        if (pendingCommand && isHost) {
            if (pendingCommand.action === 'SCORE' && pendingCommand.mode && pendingCommand.id !== undefined && pendingCommand.delta !== undefined) {
                updateScore(pendingCommand.mode, pendingCommand.id, pendingCommand.delta);
            } else if (pendingCommand.action === 'CLOCK' && pendingCommand.clockAction) {
                handleShotClockControl(pendingCommand.clockAction, pendingCommand.clockValue);
            }
            setPendingCommand(null);
        }
    }, [pendingCommand, isHost]);

    // Shot Clock Logic (Host Only Timer)
    useEffect(() => {
        if (!isHost || !gameData.shotClock.isRunning || winner) return;

        const timer = setInterval(() => {
            const nextSeconds = gameData.shotClock.seconds - 1;
            
            // Audio Triggers for Host
            if (nextSeconds <= 10 && nextSeconds > 0) {
                playSound('TICK');
            }
            if (nextSeconds === 0) {
                playSound('BUZZER');
            }

            handleUpdate({
                ...gameData,
                shotClock: {
                    ...gameData.shotClock,
                    seconds: Math.max(0, nextSeconds),
                    isRunning: nextSeconds > 0
                }
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameData.shotClock, isHost, winner]);

    // Client Side Audio Trigger for Clock (Listen to changes)
    useEffect(() => {
        if (!isHost && gameData.shotClock.isRunning) {
            if (gameData.shotClock.seconds <= 10 && gameData.shotClock.seconds > 0) {
                 playSound('TICK');
            }
             if (gameData.shotClock.seconds === 0) {
                 playSound('BUZZER');
            }
        }
    }, [gameData.shotClock.seconds, isHost]);


    const handleShotClockControl = useCallback((action: 'START' | 'STOP' | 'RESET' | 'EXT' | 'SET_TIME', value?: number) => {
        if (!isHost) {
            // Viewer requesting clock control
            sendCommand({ action: 'CLOCK', clockAction: action, clockValue: value });
            return;
        }

        const current = gameData.shotClock;
        let newState = { ...current };

        switch (action) {
            case 'START':
                newState.isRunning = true;
                break;
            case 'STOP':
                newState.isRunning = false;
                break;
            case 'RESET':
                newState.seconds = current.initialSeconds;
                newState.isRunning = false;
                break;
            case 'EXT':
                newState.seconds += 30;
                playSound('EXT');
                break;
            case 'SET_TIME':
                if (value) {
                    newState.initialSeconds = value;
                    newState.seconds = value;
                    newState.isRunning = false;
                }
                break;
        }

        handleUpdate({ ...gameData, shotClock: newState });
    }, [gameData, isHost, handleUpdate, sendCommand]);

    // Idle Timer
    useEffect(() => {
        const isDefaultState = isFocusMode && activeView === 'score' && !isHistoryModalOpen && !showConfigModal && !showQRModal;
        if (isDefaultState) return;

        let timeoutId: number;

        const revertToFullScreen = () => {
            setIsFocusMode(true);
            setActiveView('score');
            setIsHistoryModalOpen(false);
            setShowConfigModal(false);
            setShowQRModal(false);
            setIsManageMode(false);
        };

        const resetTimer = () => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(revertToFullScreen, 21000);
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'wheel'];
        
        resetTimer();
        events.forEach(e => window.addEventListener(e, resetTimer));

        return () => {
            window.clearTimeout(timeoutId);
            events.forEach(e => window.removeEventListener(e, resetTimer));
        };
    }, [isFocusMode, activeView, isHistoryModalOpen, showConfigModal, isManageMode, showQRModal]);

    // Game Logic Actions
    const addHistory = useCallback((prevData: GameData, msg: string, type: HistoryFilter = 'info'): HistoryEntry[] => {
        let scoreSnapshot: string | { n: string; s: number }[] = '';
        if (prevData.gameMode === '1vs1') {
            scoreSnapshot = `${prevData.players1vs1[0]?.name}: ${prevData.players1vs1[0]?.score} - ${prevData.players1vs1[1]?.name}: ${prevData.players1vs1[1]?.score}`;
        } else {
            scoreSnapshot = prevData.playersDen.map(p => ({ n: p.name, s: p.score }));
        }

        const newEntry: HistoryEntry = {
            id: Date.now(),
            time: getCurrentTime(),
            text: msg,
            type: type,
            snapshot: scoreSnapshot
        };
        return [newEntry, ...(prevData.history || [])].slice(0, 100);
    }, []);

    const updateScore = useCallback((mode: '1vs1' | 'den', id: number, delta: number) => {
        // If Viewer: Send Command instead of updating directly
        if (!isHost) {
            sendCommand({ action: 'SCORE', mode, id, delta });
            return;
        }

        if (winner) return;

        if (delta > 0) {
            setStreak(prev => prev.playerId === id ? { playerId: id, count: prev.count + delta } : { playerId: id, count: delta });
        } else if (streak.playerId === id) {
            setStreak({ playerId: null, count: 0 });
        }

        const newData = { ...gameData };
        let playerName = "";
        let oldScore = 0;
        let newScore = 0;

        if (mode === '1vs1') {
            newData.players1vs1 = gameData.players1vs1.map(p => {
                if (p.id === id) {
                    playerName = p.name;
                    oldScore = p.score;
                    newScore = Math.max(0, p.score + delta);
                    if (newScore === gameData.raceTo && gameData.raceTo > 0) {
                        setWinner(p.name);
                    }
                    return { ...p, score: newScore };
                }
                return p;
            });
        } else {
            newData.playersDen = gameData.playersDen.map(p => {
                if (p.id === id) {
                    playerName = p.name;
                    oldScore = p.score;
                    newScore = p.score + delta;
                    return { ...p, score: newScore };
                }
                return p;
            });
        }

        // Auto Reset Shot Clock on Score (Mosconi style)
        // Directly update the newData object to avoid race condition with handleShotClockControl
        if (delta > 0) {
            newData.shotClock = {
                ...newData.shotClock,
                seconds: newData.shotClock.initialSeconds,
                isRunning: false
            };
        }

        const changeStr = delta > 0 ? `+${delta}` : `${delta}`;
        newData.history = addHistory(newData, `${playerName}: ${changeStr} (${oldScore} → ${newScore})`, 'score');
        handleUpdate(newData);
    }, [gameData, winner, streak, addHistory, handleUpdate, isHost, sendCommand]);

    const editName = useCallback((mode: '1vs1' | 'den', id: number, newName: string) => {
        if (!isHost) return;
        const newData = { ...gameData };
        if (mode === '1vs1') newData.players1vs1 = gameData.players1vs1.map(p => p.id === id ? { ...p, name: newName } : p);
        else newData.playersDen = gameData.playersDen.map(p => p.id === id ? { ...p, name: newName } : p);
        handleUpdate(newData);
    }, [gameData, handleUpdate, isHost]);

    const addPlayerDen = useCallback(() => {
        if (!isHost) return;
        const newData = { ...gameData };
        const nextColorIdx = newData.playersDen.length % playerColors.length;
        const newName = `PLAYER ${String.fromCharCode(65 + gameData.playersDen.length)}`;
        newData.playersDen = [...gameData.playersDen, {
            id: Date.now(),
            name: newName,
            score: 0,
            personal: 0,
            colorIdx: nextColorIdx
        }];
        newData.history = addHistory(newData, `Thêm người chơi: ${newName}`, 'system');
        handleUpdate(newData);
    }, [gameData, playerColors, addHistory, handleUpdate, isHost]);

    const removePlayerDen = useCallback((id: number) => {
        if (!isHost) return;
        if (gameData.playersDen.length <= 2) return;
        const newData = { ...gameData };
        const playerToRemove = newData.playersDen.find(p => p.id === id);
        newData.playersDen = gameData.playersDen.filter(p => p.id !== id);
        if (playerToRemove) {
            newData.history = addHistory(newData, `Xóa người chơi: ${playerToRemove.name}`, 'system');
        }
        handleUpdate(newData);
    }, [gameData, addHistory, handleUpdate, isHost]);

    const autoBalance = useCallback((targetId: number) => {
        if (!isHost) return;
        const currentSumExcludingTarget = gameData.playersDen.filter(p => p.id !== targetId).reduce((acc, p) => acc + p.score, 0);
        const newData = { ...gameData };
        let playerName = "", oldScore = 0;
        const newScore = -currentSumExcludingTarget;

        newData.playersDen = gameData.playersDen.map(p => {
            if (p.id === targetId) {
                playerName = p.name;
                oldScore = p.score;
                return { ...p, score: newScore };
            }
            return p;
        });
        newData.history = addHistory(newData, `Cân bằng: ${playerName} (${oldScore} → ${newScore})`, 'balance');
        handleUpdate(newData);
    }, [gameData, addHistory, handleUpdate, isHost]);
    
    const movePlayer = useCallback((index: number, direction: 1 | -1) => {
        if (!isHost) return;
        const newData = { ...gameData };
        const players = [...newData.playersDen];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < players.length) {
            [players[index], players[newIndex]] = [players[newIndex], players[index]];
            newData.playersDen = players;
            handleUpdate(newData);
        }
    }, [gameData, handleUpdate, isHost]);

    const resetAllData = useCallback(() => {
        if (!isHost) return;
        if(window.confirm("Are you sure you want to reset all data for this room?")) {
            setLastSessionBackup(gameData);
            const newData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
            newData.history = [{ id: Date.now(), time: getCurrentTime(), text: "Bắt đầu trận đấu mới", type: 'system', snapshot: '' }];
            setWinner(null);
            setStreak({ playerId: null, count: 0 });
            handleUpdate(newData);
        }
    }, [gameData, handleUpdate, isHost]);

    const recallData = useCallback(() => {
        if (!isHost) return;
        if (!lastSessionBackup) return;
        handleUpdate(lastSessionBackup);
        setLastSessionBackup(null);
    }, [lastSessionBackup, handleUpdate, isHost]);
    
    const shareRoom = useCallback(async () => {
        setShowQRModal(true);
    }, []);

    const handleExportCSV = useCallback(() => {
        const billingData = calculateBillingData(gameData);
        const BOM = "\uFEFF";
        let csvContent = BOM + `Ngày xuất,${new Date().toLocaleString('vi-VN')}\n`;
        csvContent += `Mã phòng,${sessionId}\n\n`;
        csvContent += "Tên cơ thủ,Điểm số,Tiền giờ,Phụ thu,Tiền độ (Thắng/Thua),Tổng phải trả\n";
        billingData.forEach(p => {
            const gm = p.gameExchange !== undefined ? p.gameExchange : 0;
            csvContent += `"${p.name}",${p.score},${p.tableShare},${p.personal},${gm},${p.total}\n`;
        });
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PST_Bill_${sessionId}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [gameData, sessionId]);

    // Effects
    useEffect(() => {
        let interval: number;
        if (winner && window.confetti) {
            const runConfetti = () => window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
            runConfetti();
            interval = window.setInterval(runConfetti, 3000);
        }
        return () => clearInterval(interval);
    }, [winner]);
    
    // Loading Screen
    if (isLoadingRoom && isOnline) {
        return (
            <div className={`h-screen flex items-center justify-center ${themeClasses}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="loading-spinner border-fuchsia-500"></div>
                    <p className="text-sm font-bold tracking-widest uppercase opacity-60 animate-pulse">Establishing P2P Connection...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`h-screen flex flex-col transition-colors duration-500 ${themeClasses} overflow-hidden`}>
            
            <ReactionOverlay reaction={lastReaction} />
            
            {permissionError && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-6 backdrop-blur-md">Error: Permission Denied</div>}
            
            <HistoryModal 
                isOpen={isHistoryModalOpen} 
                onClose={() => setIsHistoryModalOpen(false)}
                history={gameData.history || []}
                glassPanel={glassPanel}
                subPanel={subPanel}
            />

            <QRCodeModal 
                isOpen={showQRModal} 
                onClose={() => setShowQRModal(false)} 
                url={window.location.href} 
            />
            
            {showConfigModal && <BaseModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Config"><div className="p-4 text-center">Offline Config Placeholder</div></BaseModal>}

            {/* Viewer Mode Floating Controls */}
            {!isHost && isOnline && (
                 <div className="fixed bottom-32 right-6 z-[90] flex flex-col gap-3 items-end">
                    <div className="px-4 py-2 bg-amber-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-none mb-2">
                        <Icon name="users" size={14} /> REMOTE CONNECTED
                    </div>
                    <button onClick={() => sendReaction('❤️')} className="w-14 h-14 bg-red-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-90 border-2 border-white/20">
                        <Icon name="heart" size={28} fill="currentColor" className="text-white"/>
                    </button>
                    <button onClick={() => sendReaction('👏')} className="w-14 h-14 bg-blue-500 rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition-transform active:scale-90 border-2 border-white/20">
                        👏
                    </button>
                </div>
            )}
            
            {/* Header */}
            <Header 
                sessionId={sessionId} isOnline={isOnline} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
                syncing={syncing} theme={theme} setTheme={setTheme} subPanel={subPanel} glassPanel={glassPanel}
                gameData={gameData} lastSessionBackup={lastSessionBackup} shareRoom={shareRoom}
                setIsHistoryModalOpen={setIsHistoryModalOpen} resetAllData={resetAllData} recallData={recallData}
                handleExportCSV={handleExportCSV} setShowConfigModal={setShowConfigModal}
            />
            
            {!isFocusMode && (
                <div className="px-6 py-2 flex gap-3">
                    <button onClick={() => setActiveView('score')} className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all duration-300 transform ${activeView === 'score' ? 'bg-fuchsia-600 text-white shadow-lg translate-y-0' : 'opacity-40 translate-y-1 hover:translate-y-0 hover:opacity-70'}`}><Icon name="trophy" size={16} /> SCORE</button>
                    <button onClick={() => setActiveView('bill')} className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all duration-300 transform ${activeView === 'bill' ? 'bg-cyan-600 text-white shadow-lg translate-y-0' : 'opacity-40 translate-y-1 hover:translate-y-0 hover:opacity-70'}`}><Icon name="calc" size={16} /> BILL</button>
                </div>
            )}
            
            <main className={`flex-1 flex flex-col overflow-hidden px-6 py-4 relative`}>
                 {/* View Transitions */}
                <div className={`absolute inset-0 px-6 py-4 transition-all duration-500 ease-in-out ${activeView === 'score' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                    <ScoreBoard 
                        gameData={gameData} handleUpdate={handleUpdate} updateScore={updateScore} editName={editName}
                        addPlayerDen={addPlayerDen} removePlayerDen={removePlayerDen} autoBalance={autoBalance} movePlayer={movePlayer}
                        winner={winner} isFocusMode={isFocusMode} isManageMode={isManageMode} setIsManageMode={setIsManageMode}
                        streak={streak} theme={theme} playerColors={playerColors} glassPanel={glassPanel} subPanel={subPanel}
                    />
                </div>
                
                <div className={`absolute inset-0 px-6 py-4 transition-all duration-500 ease-in-out ${activeView === 'bill' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                     <BillingView 
                        gameData={gameData} handleUpdate={handleUpdate} subPanel={subPanel} 
                        glassPanel={glassPanel} theme={theme} playerColors={playerColors} 
                    />
                </div>
            </main>

            {/* Shot Clock Overlay - Always visible in Score view */}
            {activeView === 'score' && (
                <ShotClock 
                    state={gameData.shotClock} 
                    isHost={isHost} 
                    onControl={handleShotClockControl} 
                />
            )}
        </div>
    );
};

export default App;
