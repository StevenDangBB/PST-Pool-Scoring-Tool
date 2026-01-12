
import React, { useMemo } from 'react';
import type { GameData, Theme, PlayerColor, Player } from '../types';
import { calculateBillingData } from '../utils';
import Icon from './Icon';

interface BillingViewProps {
    gameData: GameData;
    handleUpdate: (data: GameData) => void;
    subPanel: string;
    glassPanel: string;
    theme: Theme;
    playerColors: PlayerColor[];
}

const BillingView: React.FC<BillingViewProps> = ({ gameData, handleUpdate, subPanel, glassPanel, theme, playerColors }) => {
    const billingData = useMemo(() => calculateBillingData(gameData), [gameData]);

    const updatePersonalCost = (playerId: number, value: number) => {
        const newData = { ...gameData };
        const players = gameData.gameMode === '1vs1' ? newData.players1vs1 : newData.playersDen;
        const updatedPlayers = players.map(p => p.id === playerId ? { ...p, personal: value } : p);

        if (gameData.gameMode === '1vs1') {
            newData.players1vs1 = updatedPlayers as Player[];
        } else {
            newData.playersDen = updatedPlayers as Player[];
        }
        handleUpdate(newData);
    };

    return (
        <div className="flex-1 overflow-y-auto space-y-6 pb-10 pr-1 text-center animate-fadeIn">
            <section className={`rounded-[2.5rem] overflow-hidden ${glassPanel} border`}>
                <div className="p-8 space-y-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4 text-slate-700">
                            <Icon name="calc" className="text-cyan-600" />
                            <h3 className="text-xl font-black uppercase">Settlement</h3>
                        </div>
                    </div>
                    <div className="space-y-5 text-left">
                        <div>
                            <label className="text-[10px] font-black uppercase opacity-40 mb-1 block ml-1">Hourly Fee (x1,000)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 text-cyan-600 font-black">k</span>
                                <input 
                                    type="number" 
                                    value={gameData.tableBill / 1000 || ''} 
                                    onChange={(e) => handleUpdate({ ...gameData, tableBill: (parseInt(e.target.value) || 0) * 1000 })} 
                                    className={`w-full py-4 pl-12 pr-16 rounded-2xl font-black text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${subPanel}`} 
                                    placeholder="40" 
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 font-black text-[10px]">.000</span>
                            </div>
                        </div>
                        {gameData.gameMode === 'den' ? (
                            <div className="text-left">
                                <label className="text-[10px] font-black uppercase opacity-40 mb-1 block ml-1">Bet Per Point (x1,000)</label>
                                <div className="relative group">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 text-cyan-600 font-black">k</span>
                                    <input 
                                        type="number" 
                                        value={gameData.unitPrice / 1000 || ''} 
                                        onChange={(e) => handleUpdate({ ...gameData, unitPrice: (parseInt(e.target.value) || 0) * 1000 })} 
                                        className={`w-full py-4 pl-12 pr-16 rounded-2xl font-black text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${subPanel}`} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-left">
                                <label className="text-[10px] font-black uppercase opacity-40 mb-1 block ml-1">Split Policy</label>
                                <div className="relative">
                                    <select 
                                        value={gameData.splitMode} 
                                        onChange={(e) => handleUpdate({ ...gameData, splitMode: e.target.value as '73' | 'equal' })} 
                                        className={`w-full py-4 px-6 rounded-2xl font-black text-lg focus:outline-none appearance-none focus:ring-2 focus:ring-cyan-500/20 transition-all ${subPanel}`}
                                    >
                                        <option value="73">70/30 (Winner:30/Loser:70)</option>
                                        <option value="equal">50/50 (Even Split)</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><Icon name="chevronDown" size={16}/></div>
                                </div>
                            </div>
                        )}
                        <div className="text-left">
                            <label className="text-[10px] font-black uppercase opacity-40 mb-2 block ml-1">Extra Costs (Drinks/Food...)</label>
                            <div className="space-y-2">
                                {(gameData.gameMode === '1vs1' ? gameData.players1vs1 : gameData.playersDen).map(p => (
                                    <div key={p.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all hover:scale-[1.01] ${subPanel}`}>
                                        <span className="text-[9px] font-black uppercase flex-1 opacity-50 truncate">{p.name}</span>
                                        <div className="relative w-28">
                                            <input 
                                                type="number" 
                                                value={p.personal / 1000 || ''} 
                                                onChange={(e) => updatePersonalCost(p.id, (parseInt(e.target.value) || 0) * 1000)} 
                                                className="w-full bg-transparent text-right pr-4 font-black text-cyan-600 focus:outline-none text-lg" 
                                                placeholder="0" 
                                            />
                                            <span className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20 font-black text-[9px]">k</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-4 bg-slate-900/5 dark:bg-black/20">
                    {billingData.map((p, idx) => (
                        <div key={p.id} className={`p-5 rounded-[1.5rem] flex flex-col gap-3 border ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-white/80 shadow-sm'} text-left transition-all hover:shadow-md`}>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase opacity-40">{p.name}</span><span className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{p.total.toLocaleString()}đ</span></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="px-2 py-1 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg text-[8px] font-bold uppercase tracking-wider">Table: {Math.round(p.tableShare).toLocaleString()}</div>
                                {p.personal > 0 && <div className="px-2 py-1 bg-cyan-500/10 text-cyan-600 rounded-lg text-[8px] font-bold uppercase tracking-wider">Extra: {p.personal.toLocaleString()}</div>}
                                {p.gameExchange !== undefined && p.gameExchange !== 0 && <div className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider ${p.gameExchange > 0 ? 'bg-red-500/10 text-red-500' : 'bg-fuchsia-500/10 text-fuchsia-600'}`}>{p.gameExchange > 0 ? `Lost: +${p.gameExchange.toLocaleString()}` : `Won: ${p.gameExchange.toLocaleString()}`}</div>}
                            </div>
                        </div>
                    ))}
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-800 mt-6 p-6 rounded-[2rem] flex items-center justify-between text-white shadow-xl hover:shadow-2xl transition-shadow duration-500">
                        <div className="flex flex-col text-left"><span className="text-[8px] font-black uppercase opacity-70">Total Due</span><span className="text-3xl font-black italic tracking-tighter">{Math.round(billingData.reduce((acc, p) => acc + p.total, 0)).toLocaleString()}đ</span></div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md"><Icon name="check" size={24} /></div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default React.memo(BillingView);
