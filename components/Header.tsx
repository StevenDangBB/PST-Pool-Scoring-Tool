
import React from 'react';
import Icon from './Icon';
import type { Theme, GameData } from '../types';
import { generateRoomId } from '../utils';

interface HeaderProps {
    sessionId: string;
    isOnline: boolean;
    isFocusMode: boolean;
    setIsFocusMode: (val: boolean) => void;
    syncing: boolean;
    theme: Theme;
    setTheme: (t: Theme) => void;
    subPanel: string;
    glassPanel: string;
    gameData: GameData;
    lastSessionBackup: GameData | null;
    shareRoom: () => void;
    setIsHistoryModalOpen: (val: boolean) => void;
    resetAllData: () => void;
    recallData: () => void;
    handleExportCSV: () => void;
    setShowConfigModal: (val: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
    sessionId, isOnline, isFocusMode, setIsFocusMode, syncing, theme, setTheme,
    subPanel, glassPanel, gameData, lastSessionBackup, shareRoom,
    setIsHistoryModalOpen, resetAllData, recallData, handleExportCSV, setShowConfigModal
}) => {
    return (
        <header className={`px-6 py-4 flex justify-between items-center ${glassPanel} glass-effect border-b z-50 transition-all ${isFocusMode ? 'border-none bg-transparent shadow-none' : ''}`}>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsFocusMode(!isFocusMode)}>
                <div className="bg-fuchsia-600 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg rotate-3 relative group-hover:rotate-6 transition-transform">
                    <Icon name="target" className="text-white" />
                    {syncing && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping"></div>}
                </div>
                <div className="hidden sm:block">
                    <h1 className="text-lg font-black tracking-tighter leading-none bg-gradient-to-r from-fuchsia-500 to-cyan-400 bg-clip-text text-transparent uppercase">PST LIVE</h1>
                    <span className="text-[9px] font-black tracking-[0.25em] opacity-40 uppercase text-slate-400 flex items-center gap-1">
                        {isOnline ? `ROOM: ${sessionId}` : 'OFFLINE MODE'}
                    </span>
                </div>
            </div>
            {!isFocusMode && (
                <div className="flex gap-2">
                    {!isOnline && <button onClick={() => setShowConfigModal(true)} className={`p-2.5 rounded-2xl ${subPanel} text-red-500 animate-pulse`} title="Setup Sync"><Icon name="cloudOff" size={18} /></button>}
                    {isOnline && <button onClick={() => window.location.hash = generateRoomId()} className={`p-2.5 rounded-2xl ${subPanel} text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors`} title="Create New Room"><Icon name="plusSquare" size={18} /></button>}
                    <button onClick={() => setIsHistoryModalOpen(true)} className={`p-2.5 rounded-2xl ${subPanel} hover:scale-105 transition-transform`} title="History"><Icon name="history" size={18} /></button>
                    <button onClick={shareRoom} className={`p-2.5 rounded-2xl ${subPanel} hover:scale-105 transition-transform`} title="Share Room"><Icon name="share" size={18} /></button>
                    {lastSessionBackup && <button onClick={recallData} className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 animate-pulse" title="Undo Reset"><Icon name="undo" size={18} /></button>}
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`p-2.5 rounded-2xl ${subPanel} hover:rotate-12 transition-transform`}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} /></button>
                    <button onClick={handleExportCSV} className={`p-2.5 rounded-2xl ${subPanel} text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors`} title="Export CSV"><Icon name="download" size={18} /></button>
                    <button onClick={resetAllData} className={`p-2.5 rounded-2xl ${subPanel} text-fuchsia-500 hover:rotate-180 transition-transform duration-500`}><Icon name="refresh" size={18} /></button>
                </div>
            )}
        </header>
    );
};

export default React.memo(Header);
