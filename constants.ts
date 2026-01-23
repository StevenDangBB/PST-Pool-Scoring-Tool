
import type { Theme, PlayerColor, GameData } from './types';

export const getPlayerColors = (theme: Theme): PlayerColor[] => [
    { card: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50', bar: 'bg-blue-500', btn: 'hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600', text: 'text-blue-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-blue-500/10' },
    { card: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50', bar: 'bg-red-500', btn: 'hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600', text: 'text-red-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-red-500/10' },
    { card: theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50', bar: 'bg-emerald-500', btn: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600', text: 'text-emerald-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-emerald-500/10' },
    { card: theme === 'dark' ? 'bg-amber-900/20' : 'bg-amber-50', bar: 'bg-amber-500', btn: 'hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-600', text: 'text-amber-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-amber-500/10' },
    { card: theme === 'dark' ? 'bg-fuchsia-900/20' : 'bg-fuchsia-50', bar: 'bg-fuchsia-500', btn: 'hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40 text-fuchsia-600', text: 'text-fuchsia-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-fuchsia-500/10' },
    { card: theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-50', bar: 'bg-indigo-500', btn: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600', text: 'text-indigo-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-indigo-500/10' },
    { card: theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50', bar: 'bg-orange-500', btn: 'hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600', text: 'text-orange-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-orange-500/10' },
    { card: theme === 'dark' ? 'bg-teal-900/20' : 'bg-teal-50', bar: 'bg-teal-500', btn: 'hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-600', text: 'text-teal-600', watermark: theme === 'dark' ? 'text-white/5' : 'text-teal-500/10' },
];

export const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'pst-tool-v2';

export const SFX = {
    CLICK: 'https://cdn.freesound.org/previews/256/256116_4486188-lq.mp3', // Billiard Ball Clack
    WIN: 'https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3', // Applause
    BUZZER: 'https://cdn.freesound.org/previews/536/536108_11530279-lq.mp3', // Time over
    TICK: 'https://cdn.freesound.org/previews/254/254316_4062622-lq.mp3', // Heartbeat/Tick
    EXT: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' // Electronic beep
};

export const DEFAULT_GAME_DATA: GameData = {
    gameMode: '1vs1',
    raceTo: 7,
    unitPrice: 10000,
    tableBill: 0,
    splitMode: '73',
    history: [],
    players1vs1: [
        { id: 1, name: 'PLAYER 01', score: 0, personal: 0, colorIdx: 0 },
        { id: 2, name: 'PLAYER 02', score: 0, personal: 0, colorIdx: 1 },
    ],
    playersDen: [
        { id: 1, name: 'PLAYER A', score: 0, personal: 0, colorIdx: 0 },
        { id: 2, name: 'PLAYER B', score: 0, personal: 0, colorIdx: 1 },
        { id: 3, name: 'PLAYER C', score: 0, personal: 0, colorIdx: 2 },
    ],
    shotClock: {
        seconds: 30,
        initialSeconds: 30,
        isRunning: false,
        extensions: {}
    }
};
