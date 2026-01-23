
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPlayerColors } from './constants';
import { calculateBillingData } from './utils';
import type { GameData, Theme } from './types';
import Icon from './components/Icon';
import Header from './components/Header';
import ScoreBoard from './components/ScoreBoard';
import BillingView from './components/BillingView';
import HistoryModal from './components/modals/HistoryModal';
import BaseModal from './components/modals/BaseModal';
import QRCodeModal from './components/modals/QRCodeModal';
import ReactionOverlay from './components/ReactionOverlay';
import ShotClock from './components/ShotClock'; 
import { useGameSync } from './hooks/useGameSync';
import { useAudio } from './hooks/useAudio';
import { useGameLogic } from './hooks/useGameLogic';

const App: React.FC = () => {
    // --- UI State ---
    const [theme, setTheme] = useState<Theme>('dark');
    const [activeView, setActiveView] = useState<'score' | 'bill'>('score');
    const [lastSessionBackup, setLastSessionBackup] = useState<GameData | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(true);
    const [isManageMode, setIsManageMode] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(false); // New Lock State

    // --- Hooks & Logic ---
    const { playSound } = useAudio();
    
    // Sync Hook (P2P)
    const { 
        sessionId, gameData, isOnline, isLoadingRoom, 
        syncing, permissionError, handleUpdate, isHost, 
        lastReaction, sendReaction, pendingCommand, setPendingCommand, sendCommand
    } = useGameSync();

    const playerColors = useMemo(() => getPlayerColors(theme), [theme]);

    // Game Business Logic Hook
    const {
        winner, setWinner, streak, setStreak, updateScore, toggleBreak, editName, 
        addPlayerDen, removePlayerDen, autoBalance, movePlayer, resetGame
    } = useGameLogic({ 
        gameData, isHost, handleUpdate, sendCommand, playSound, playerColors 
    });

    // --- Derived Styles ---
    // Background handling moved to index.html (bg-aurora class)
    const themeClasses = theme === 'dark' ? 'text-slate-100' : 'bg-slate-50 text-slate-900';
    const glassPanel = theme === 'dark' ? 'bg-white/[0.03] border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]' : 'bg-white/70 border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)]';
    const subPanel = theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border border-slate-200';

    // --- Auto Focus Mode for Den Mode (21s Inactivity) ---
    useEffect(() => {
        // Only active if:
        // 1. In Den Mode
        // 2. Not already in Focus Mode
        // 3. Currently viewing Score (not Bill)
        // 4. No modals are open
        if (
            gameData.gameMode !== 'den' || 
            isFocusMode || 
            activeView !== 'score' ||
            isHistoryModalOpen || 
            showConfigModal || 
            showQRModal
        ) return;

        let timeoutId: ReturnType<typeof setTimeout>;

        const resetTimer = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setIsFocusMode(true);
                // Also turn off manage mode if it was on
                setIsManageMode(false);
            }, 21000); // 21 seconds
        };

        // Start initial timer
        resetTimer();

        // Events that reset the timer
        const events = ['mousedown', 'mousemove', 'touchstart', 'keydown', 'click'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [
        gameData.gameMode, 
        isFocusMode, 
        activeView, 
        isHistoryModalOpen, 
        showConfigModal, 
        showQRModal
    ]);

    // --- Remote Command Handling ---
    useEffect(() => {
        if (pendingCommand && isHost) {
            const { action, mode, id, delta, clockAction, clockValue } = pendingCommand;
            if (action === 'SCORE' && mode && id !== undefined && delta !== undefined) {
                updateScore(mode, id, delta);
            } else if (action === 'CLOCK' && clockAction) {
                handleShotClockControl(clockAction, clockValue);
            }
            setPendingCommand(null);
        }
    }, [pendingCommand, isHost]); // Depend on dependencies needed for updateScore

    // --- Shot Clock Logic (Host Only) ---
    // This causes re-renders every second, but ScoreBoard is memoized to ignore it.
    useEffect(() => {
        // Only run clock logic if in 1vs1 mode
        if (!isHost || !gameData.shotClock.isRunning || winner || gameData.gameMode !== '1vs1') return;

        const timer = setInterval(() => {
            const nextSeconds = gameData.shotClock.seconds - 1;
            
            // Audio Triggers
            if (nextSeconds <= 10 && nextSeconds > 0) playSound('TICK');
            if (nextSeconds === 0) playSound('BUZZER');

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
    }, [gameData.shotClock.isRunning, gameData.shotClock.seconds, isHost, winner, gameData.gameMode]); 

    // Client Side Audio Trigger for Clock (Viewer Mode)
    useEffect(() => {
        if (!isHost && gameData.shotClock.isRunning && gameData.gameMode === '1vs1') {
            if (gameData.shotClock.seconds <= 10 && gameData.shotClock.seconds > 0) playSound('TICK');
             if (gameData.shotClock.seconds === 0) playSound('BUZZER');
        }
    }, [gameData.shotClock.seconds, isHost, gameData.gameMode]);

    const handleShotClockControl = useCallback((action: 'START' | 'STOP' | 'RESET' | 'EXT' | 'SET_TIME', value?: number) => {
        if (!isHost) {
            sendCommand({ action: 'CLOCK', clockAction: action, clockValue: value });
            return;
        }

        const current = gameData.shotClock;
        let newState = { ...current };

        switch (action) {
            case 'START': newState.isRunning = true; break;
            case 'STOP': newState.isRunning = false; break;
            case 'RESET': newState.seconds = current.initialSeconds; newState.isRunning = false; break;
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
    }, [gameData, isHost, handleUpdate, sendCommand, playSound]);

    // --- Feature Handlers ---
    const handleResetAll = useCallback(() => {
        if (!isHost) return;
        if(window.confirm("Are you sure you want to reset all data?")) {
            setLastSessionBackup(gameData);
            resetGame();
        }
    }, [gameData, isHost, resetGame]);

    const handleRecall = useCallback(() => {
        if (!isHost || !lastSessionBackup) return;
        handleUpdate(lastSessionBackup);
        setLastSessionBackup(null);
    }, [lastSessionBackup, handleUpdate, isHost]);

    const handleExportCSV = useCallback(() => {
        const billingData = calculateBillingData(gameData);
        const BOM = "\uFEFF";
        let csvContent = BOM + `Ngày xuất,${new Date().toLocaleString('vi-VN')}\nMã phòng,${sessionId}\n\nTên cơ thủ,Điểm số,Tiền giờ,Phụ thu,Tiền độ,Tổng\n`;
        billingData.forEach(p => {
            const gm = p.gameExchange !== undefined ? p.gameExchange : 0;
            csvContent += `"${p.name}",${p.score},${p.tableShare},${p.personal},${gm},${p.total}\n`;
        });
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `PST_Bill_${sessionId}_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [gameData, sessionId]);

    // --- Confetti Effect ---
    useEffect(() => {
        let interval: number;
        if (winner && window.confetti) {
            const runConfetti = () => window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
            runConfetti();
            interval = window.setInterval(runConfetti, 3000);
        }
        return () => clearInterval(interval);
    }, [winner]);

    // --- Loading View ---
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

            <QRCodeModal isOpen={showQRModal} onClose={() => setShowQRModal(false)} url={window.location.href} />
            {showConfigModal && <BaseModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Config"><div className="p-4 text-center">Offline Config Placeholder</div></BaseModal>}

            {/* Viewer Controls */}
            {!isHost && isOnline && (
                 <div className="fixed bottom-32 right-6 z-[90] flex flex-col gap-3 items-end">
                    <div className="px-4 py-2 bg-amber-500/90 backdrop-blur-md text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-2 pointer-events-none mb-2">
                        <Icon name="users" size={14} /> REMOTE
                    </div>
                    <button onClick={() => sendReaction('❤️')} className="w-14 h-14 bg-red-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-90 border-2 border-white/20"><Icon name="heart" size={28} fill="currentColor" className="text-white"/></button>
                    <button onClick={() => sendReaction('👏')} className="w-14 h-14 bg-blue-500 rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-110 active:scale-90 border-2 border-white/20">👏</button>
                </div>
            )}
            
            <Header 
                sessionId={sessionId} isOnline={isOnline} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
                syncing={syncing} theme={theme} setTheme={setTheme} subPanel={subPanel} glassPanel={glassPanel}
                gameData={gameData} lastSessionBackup={lastSessionBackup} shareRoom={() => setShowQRModal(true)}
                setIsHistoryModalOpen={setIsHistoryModalOpen} resetAllData={handleResetAll} recallData={handleRecall}
                handleExportCSV={handleExportCSV} setShowConfigModal={setShowConfigModal}
                isLocked={isLocked} setIsLocked={setIsLocked}
            />
            
            {!isFocusMode && (
                <div className="px-6 py-2 flex gap-3">
                    <button onClick={() => setActiveView('score')} className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all duration-300 transform ${activeView === 'score' ? 'bg-fuchsia-600 text-white shadow-lg translate-y-0' : 'opacity-40 translate-y-1 hover:translate-y-0 hover:opacity-70'}`}><Icon name="trophy" size={16} /> SCORE</button>
                    <button onClick={() => setActiveView('bill')} className={`flex-1 py-3 px-4 rounded-2xl font-black text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all duration-300 transform ${activeView === 'bill' ? 'bg-cyan-600 text-white shadow-lg translate-y-0' : 'opacity-40 translate-y-1 hover:translate-y-0 hover:opacity-70'}`}><Icon name="calc" size={16} /> BILL</button>
                </div>
            )}
            
            <main className={`flex-1 flex flex-col overflow-hidden px-6 py-4 relative`}>
                <div className={`absolute inset-0 px-6 py-4 transition-all duration-500 ease-in-out ${activeView === 'score' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 -translate-x-10 pointer-events-none'}`}>
                    <ScoreBoard 
                        gameData={gameData} handleUpdate={handleUpdate} updateScore={updateScore} editName={editName} toggleBreak={toggleBreak}
                        addPlayerDen={addPlayerDen} removePlayerDen={removePlayerDen} autoBalance={autoBalance} movePlayer={movePlayer}
                        resetGame={resetGame}
                        winner={winner} isFocusMode={isFocusMode} isManageMode={isManageMode} setIsManageMode={setIsManageMode} isLocked={isLocked}
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

            {/* Shot Clock - Only show in Score View AND 1vs1 Mode */}
            {activeView === 'score' && gameData.gameMode === '1vs1' && (
                <ShotClock state={gameData.shotClock} isHost={isHost} onControl={handleShotClockControl} />
            )}
        </div>
    );
};

export default App;