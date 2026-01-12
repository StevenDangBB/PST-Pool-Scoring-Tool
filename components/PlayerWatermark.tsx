
import React from 'react';

interface PlayerWatermarkProps {
    name: string;
    colorClass: string;
}

const PlayerWatermark: React.FC<PlayerWatermarkProps> = ({ name, colorClass }) => {
    const pattern = Array(25).fill(name || "PLAYER").join("   •   ");
    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <div className="absolute inset-[-50%] w-[200%] h-[200%] flex flex-wrap content-center justify-center -rotate-45 transform origin-center">
                 {Array(15).fill(0).map((_, i) => (
                     <div key={i} className={`w-full text-center text-4xl sm:text-6xl font-black uppercase whitespace-nowrap leading-tight ${colorClass}`}>
                        {pattern}
                     </div>
                 ))}
            </div>
        </div>
    );
};

export default PlayerWatermark;
