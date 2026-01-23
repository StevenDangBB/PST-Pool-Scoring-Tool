
import { useRef, useCallback } from 'react';
import { SFX } from '../constants';

type SoundType = 'CLICK' | 'WIN' | 'BUZZER' | 'TICK' | 'EXT';

export const useAudio = () => {
    const audioRef = useRef<HTMLAudioElement>(new Audio());

    const playSound = useCallback((type: SoundType) => {
        if (audioRef.current) {
            audioRef.current.src = SFX[type];
            audioRef.current.volume = type === 'TICK' ? 0.6 : 1.0;
            // Catch error to prevent crashes if user hasn't interacted with DOM yet
            audioRef.current.play().catch(() => {}); 
        }
    }, []);

    return { playSound };
};
