
import type { GameData, BillingData } from './types';

export const generateRoomId = (): string => Math.random().toString(36).substring(2, 8).toUpperCase();

export const getSessionId = (): string => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) {
        const newId = generateRoomId();
        window.location.hash = newId;
        return newId;
    }
    return hash;
};

export const getCurrentTime = (): string => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

export const calculateBillingData = (gameData: GameData): BillingData[] => {
    const { gameMode, players1vs1, playersDen, tableBill, splitMode, unitPrice } = gameData;
    
    if (gameMode === '1vs1') {
        if(players1vs1.length < 2) return [];
        const [p1, p2] = players1vs1;
        let p1T, p2T;
        if (splitMode === 'equal' || p1.score === p2.score) {
            p1T = p2T = tableBill / 2;
        } else {
            const p1Win = p1.score > p2.score;
            p1T = p1Win ? tableBill * 0.3 : tableBill * 0.7;
            p2T = !p1Win ? tableBill * 0.3 : tableBill * 0.7;
        }
        return [
            { ...p1, tableShare: p1T, total: p1T + p1.personal }, 
            { ...p2, tableShare: p2T, total: p2T + p2.personal }
        ];
    } else { // 'den' mode
        const players = playersDen;
        const share = tableBill / (players.length || 1);
        return players.map(p => ({
            ...p,
            tableShare: share,
            gameExchange: -(p.score * unitPrice),
            total: share - (p.score * unitPrice) + p.personal
        }));
    }
};
