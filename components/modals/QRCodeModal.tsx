
import React from 'react';
import BaseModal from './BaseModal';
import Icon from '../Icon';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, url }) => {
    // Using a reliable public QR code API
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Scan to Join" maxWidth="max-w-md">
            <div className="flex flex-col items-center gap-6 p-4">
                <div className="bg-white p-4 rounded-3xl shadow-inner">
                    <img src={qrImage} alt="Room QR Code" className="w-56 h-56 object-contain" />
                </div>
                
                <div className="text-center space-y-2">
                    <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Share this link</p>
                    <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-xl flex items-center gap-2">
                        <span className="text-xs font-mono break-all text-slate-500 dark:text-slate-400 select-all">{url}</span>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(url);
                        // Visual feedback handled by parent or just close
                        onClose();
                    }} 
                    className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <Icon name="check" size={20} /> Copy Link & Close
                </button>
            </div>
        </BaseModal>
    );
};

export default QRCodeModal;
