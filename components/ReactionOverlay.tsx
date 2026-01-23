
import React, { useEffect, useState } from 'react';
import type { ReactionData } from '../types';

interface ReactionOverlayProps {
    reaction: ReactionData | null;
}

interface FloatingItem {
    id: number;
    emoji: string;
    left: number; // Percentage
}

const ReactionOverlay: React.FC<ReactionOverlayProps> = ({ reaction }) => {
    const [items, setItems] = useState<FloatingItem[]>([]);

    useEffect(() => {
        if (reaction) {
            const newItem: FloatingItem = {
                id: reaction.id + Math.random(), // Ensure uniqueness
                emoji: reaction.emoji,
                left: Math.random() * 80 + 10, // Random position 10% - 90%
            };
            setItems(prev => [...prev, newItem]);

            // Auto remove after animation
            setTimeout(() => {
                setItems(prev => prev.filter(i => i.id !== newItem.id));
            }, 3000);
        }
    }, [reaction]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {items.map(item => (
                <div
                    key={item.id}
                    className="absolute bottom-0 text-4xl animate-float-up opacity-0 will-change-transform"
                    style={{ left: `${item.left}%` }}
                >
                    {item.emoji}
                </div>
            ))}
            <style>{`
                @keyframes floatUp {
                    0% { transform: translateY(0) scale(0.5); opacity: 0; }
                    10% { opacity: 1; transform: translateY(-50px) scale(1.2); }
                    100% { transform: translateY(-80vh) scale(1); opacity: 0; }
                }
                .animate-float-up {
                    animation: floatUp 3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ReactionOverlay;
