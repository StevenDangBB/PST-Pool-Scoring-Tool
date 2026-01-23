
import { useCallback, useState, useEffect } from 'react';
import type { GameData, HistoryEntry, HistoryFilter, Player, PlayerColor } from '../types';
import { getCurrentTime } from '../utils';
import { DEFAULT_GAME_DATA } from '../constants';

interface UseGameLogicProps {
    gameData: GameData;
    isHost: boolean;
    handleUpdate: (data: GameData) => void;
    sendCommand: (cmd: any) => void;
    playSound: (type: any) => void;
    playerColors: PlayerColor[];
}

export const useGameLogic = ({ 
    gameData, isHost, handleUpdate, sendCommand, playSound, playerColors 
}: UseGameLogicProps) => {
    const [winner, setWinner] = useState<string | null>(null);
    const [streak, setStreak] = useState<{ playerId: number | null; count: number }>({ playerId: null, count: 0 });

    // Restore Winner State from Data (Fix for Reload Bug)
    useEffect(() => {
        if (gameData.gameMode === '1vs1' && gameData.raceTo > 0) {
            const p1 = gameData.players1vs1[0];
            const p2 = gameData.players1vs1[1];
            // Only set winner if not already set to avoid loops, but ensure it matches data
            if (p1.score >= gameData.raceTo) {
                 setWinner(prev => prev === p1.name ? prev : p1.name);
            } else if (p2.score >= gameData.raceTo) {
                 setWinner(prev => prev === p2.name ? prev : p2.name);
            } else {
                 setWinner(null);
            }
        } else {
            setWinner(null);
        }
    }, [gameData.players1vs1, gameData.raceTo, gameData.gameMode]);

    // Haptic Feedback Utility
    const vibrate = useCallback((pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    // History Helper
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

    // Score Update Logic
    const updateScore = useCallback((mode: '1vs1' | 'den', id: number, delta: number) => {
        if (!isHost) {
            sendCommand({ action: 'SCORE', mode, id, delta });
            return;
        }

        if (winner && delta > 0) return; // Prevent adding score if winner exists (allow subtract to correct)

        // Haptic Feedback for score change
        vibrate(delta > 0 ? 50 : 30);

        // Streak Logic
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
                    if (newScore === gameData.raceTo && gameData.raceTo > 0 && delta > 0) {
                        // Winner logic handled by useEffect, but trigger effects here
                        playSound('WIN');
                        vibrate([100, 50, 100, 50, 200]); 
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

        // Auto Reset Shot Clock on Score (Mosconi Rule)
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
    }, [gameData, winner, streak, isHost, sendCommand, handleUpdate, addHistory, playSound, vibrate]);

    // Break Toggle Logic
    const toggleBreak = useCallback(() => {
        if (!isHost || gameData.gameMode !== '1vs1') return;
        
        const currentBreakId = gameData.breakPlayerId;
        const p1 = gameData.players1vs1[0];
        const p2 = gameData.players1vs1[1];
        
        // If no break set (e.g. older version data), default to P1. If set, swap.
        const nextBreakId = (currentBreakId === p1.id) ? p2.id : p1.id;
        
        const newData = { ...gameData, breakPlayerId: nextBreakId };
        vibrate(20);
        handleUpdate(newData);
    }, [gameData, isHost, handleUpdate, vibrate]);


    // Name Editing
    const editName = useCallback((mode: '1vs1' | 'den', id: number, newName: string) => {
        if (!isHost) return;
        const newData = { ...gameData };
        if (mode === '1vs1') newData.players1vs1 = gameData.players1vs1.map(p => p.id === id ? { ...p, name: newName } : p);
        else newData.playersDen = gameData.playersDen.map(p => p.id === id ? { ...p, name: newName } : p);
        handleUpdate(newData);
    }, [gameData, isHost, handleUpdate]);

    // Player Management (Den Mode)
    const addPlayerDen = useCallback(() => {
        if (!isHost) return;
        // Limit Max 5 Players
        if (gameData.playersDen.length >= 5) return;

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
    }, [gameData, isHost, handleUpdate, addHistory, playerColors]);

    const removePlayerDen = useCallback((id: number) => {
        if (!isHost) return;
        // Limit Min 2 Players
        if (gameData.playersDen.length <= 2) return;
        
        const newData = { ...gameData };
        const playerToRemove = newData.playersDen.find(p => p.id === id);
        newData.playersDen = gameData.playersDen.filter(p => p.id !== id);
        if (playerToRemove) {
            newData.history = addHistory(newData, `Xóa người chơi: ${playerToRemove.name}`, 'system');
        }
        handleUpdate(newData);
    }, [gameData, isHost, handleUpdate, addHistory]);

    // Auto Balance Logic
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
    }, [gameData, isHost, handleUpdate, addHistory]);

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
    }, [gameData, isHost, handleUpdate]);

    const resetGame = useCallback(() => {
        const newData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
        // Preserve player names and unit price settings, just reset scores/history
        newData.gameMode = gameData.gameMode;
        newData.raceTo = gameData.raceTo;
        newData.unitPrice = gameData.unitPrice;
        newData.tableBill = 0;
        if (gameData.gameMode === '1vs1') {
             newData.players1vs1 = gameData.players1vs1.map(p => ({...p, score: 0}));
        } else {
             newData.playersDen = gameData.playersDen.map(p => ({...p, score: 0}));
        }
        
        newData.history = [{ id: Date.now(), time: getCurrentTime(), text: "Bắt đầu trận đấu mới", type: 'system', snapshot: '' }];
        setWinner(null);
        setStreak({ playerId: null, count: 0 });
        handleUpdate(newData);
    }, [handleUpdate, gameData]);

    return {
        winner,
        setWinner,
        streak,
        setStreak,
        updateScore,
        toggleBreak,
        editName,
        addPlayerDen,
        removePlayerDen,
        autoBalance,
        movePlayer,
        resetGame
    };
};