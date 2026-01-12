
import React, { useState, useMemo } from 'react';
import type { HistoryEntry, HistoryFilter } from '../../types';
import Icon from '../Icon';
import BaseModal from './BaseModal';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryEntry[];
    glassPanel: string;
    subPanel: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, glassPanel, subPanel }) => {
    const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

    const filteredHistory = useMemo(() => 
        history.filter(item => historyFilter === 'all' || item.type === historyFilter),
    [history, historyFilter]);

    const filterButtons: { label: string; filter: HistoryFilter }[] = [
        { label: "Tất cả", filter: 'all' },
        { label: "Ghi điểm", filter: 'score' },
        { label: "Cân bằng", filter: 'balance' },
        { label: "Hệ thống", filter: 'system' }
    ];

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose} 
            glassPanel={glassPanel}
            title={<span className="flex items-center gap-2"><Icon name="history" size={20}/> Match History</span>}
        >
            <div className="w-full mb-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 no-scrollbar touch-pan-x w-full">
                    {filterButtons.map(({label, filter}) => (
                        <button 
                            key={filter} 
                            onClick={() => setHistoryFilter(filter)} 
                            className={`flex-shrink-0 h-9 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm border border-transparent ${historyFilter === filter ? 'bg-fuchsia-600 text-white shadow-fuchsia-500/30 shadow-lg scale-105' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                        <div key={item.id} className={`p-3 rounded-xl border ${subPanel} text-sm flex flex-col gap-2 transition-all hover:scale-[1.01]`}>
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-slate-700 dark:text-slate-200 leading-tight">{item.text}</span>
                                <span className="opacity-40 text-[10px] whitespace-nowrap ml-2 font-mono">{item.time}</span>
                            </div>
                            {item.snapshot && (
                                <div className="text-[10px] opacity-60 bg-black/5 dark:bg-white/5 p-2 rounded-lg font-mono">
                                    {typeof item.snapshot === 'string' ? item.snapshot : (
                                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                                            {item.snapshot.map((p, idx) => (
                                                <span key={idx}>{p.n}: <strong className={p.s < 0 ? 'text-red-500' : 'text-green-500'}>{p.s}</strong></span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : <p className="text-center opacity-40 py-10 text-sm italic">Chưa có lịch sử</p>}
            </div>
        </BaseModal>
    );
};

export default React.memo(HistoryModal);
