
import React, { useEffect, useState } from 'react';
import Icon from '../Icon';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    glassPanel?: string;
    maxWidth?: string;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children, glassPanel, maxWidth = "max-w-lg" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Small timeout to allow render before adding opacity class for transition
            requestAnimationFrame(() => setIsVisible(true));
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setShouldRender(false), 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
                onClick={onClose}
            />
            <div className={`w-full ${maxWidth} rounded-2xl ${glassPanel || 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800'} shadow-2xl flex flex-col max-h-[85vh] relative z-10 transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                {(title || onClose) && (
                    <div className="flex justify-between items-center p-6 pb-2">
                        <div className="text-lg font-black">{title}</div>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                            <Icon name="x" size={24} className="opacity-50 hover:opacity-100" />
                        </button>
                    </div>
                )}
                <div className="flex-1 overflow-hidden flex flex-col p-6 pt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BaseModal;
