import { useState, useEffect, useRef } from 'react';
import { DEFAULT_GAME_DATA, EMBEDDED_FIREBASE_CONFIG, appId } from '../constants';
import { getSessionId } from '../utils';
import type { GameData } from '../types';

export const useGameSync = () => {
    const [user, setUser] = useState<any | null>(null);
    const [sessionId, setSessionId] = useState(getSessionId());
    const [gameData, setGameData] = useState<GameData>(DEFAULT_GAME_DATA);
    const [isOnline, setIsOnline] = useState(false);
    const [isLoadingRoom, setIsLoadingRoom] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    const initAttempts = useRef(0);

    // Initial Firebase Connection with Polling
    useEffect(() => {
        const config = EMBEDDED_FIREBASE_CONFIG;
        
        const initFirebase = () => {
            if (!window.FirebaseCore || !window.FirebaseAuth) {
                if (initAttempts.current < 50) { // Try for about 5 seconds
                    initAttempts.current++;
                    setTimeout(initFirebase, 100);
                } else {
                    console.warn("Firebase scripts failed to load in time.");
                    setIsLoadingRoom(false);
                    setIsOnline(false);
                }
                return;
            }

            // Firebase is ready
            try {
                let app;
                try { app = window.FirebaseCore.initializeApp(config); } catch (e) { /* Already initialized */ }
                const auth = window.FirebaseAuth.getAuth();
                
                const initAuth = async () => {
                    try {
                        if (window.__initial_auth_token) {
                            await window.FirebaseAuth.signInWithCustomToken(auth, window.__initial_auth_token);
                        } else {
                            await window.FirebaseAuth.signInAnonymously(auth);
                        }
                        setIsOnline(true);
                    } catch (e) { 
                        console.error("Auth error:", e); 
                        setIsLoadingRoom(false); 
                    }
                };
                initAuth();
                
                const unsubscribeAuth = window.FirebaseAuth.onAuthStateChanged(auth, setUser);
                const handleHashChange = () => {
                    setSessionId(getSessionId());
                    setIsLoadingRoom(true);
                };
                window.addEventListener('hashchange', handleHashChange);

                return () => {
                    unsubscribeAuth();
                    window.removeEventListener('hashchange', handleHashChange);
                };
            } catch (e) {
                console.error("Firebase Init Error", e);
                setIsOnline(false);
                setIsLoadingRoom(false);
            }
        };

        const cleanup = initFirebase();
        return () => {
            if (typeof cleanup === 'function') cleanup();
        };
    }, []);

    // Firestore Sync
    useEffect(() => {
        if (!user || !isOnline) return;

        const { getFirestore, doc, onSnapshot, setDoc } = window.FirebaseStore;
        const db = getFirestore();
        setSyncing(true);
        const docRef = doc(db, `artifacts/${appId}/public/data/sessions/${sessionId}`);

        const unsubscribeFirestore = onSnapshot(docRef, (docSnap: any) => {
            if (docSnap.exists()) {
                setGameData(docSnap.data());
            } else {
                const resetData = JSON.parse(JSON.stringify(DEFAULT_GAME_DATA));
                setDoc(docRef, resetData).catch((err: any) => {
                    if (err.code === 'permission-denied') setPermissionError(true);
                });
                setGameData(resetData);
            }
            setIsLoadingRoom(false);
            setSyncing(false);
            setPermissionError(false);
        }, (err: any) => {
            console.error("Firestore error:", err);
            if (err.code === 'permission-denied' || err.message.includes('permission')) {
                setPermissionError(true);
            }
            setSyncing(false);
            setIsLoadingRoom(false);
        });

        return () => unsubscribeFirestore();
    }, [user, sessionId, isOnline]);

    const saveToCloud = async (newData: GameData) => {
        if (!user || !isOnline || isLoadingRoom) return;
        setSyncing(true);
        try {
            const { getFirestore, doc, setDoc } = window.FirebaseStore;
            const db = getFirestore();
            const docRef = doc(db, `artifacts/${appId}/public/data/sessions/${sessionId}`);
            await setDoc(docRef, newData);
            setPermissionError(false);
        } catch (e: any) {
            console.error("Save failed:", e);
            if (e.code === 'permission-denied') setPermissionError(true);
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdate = (newData: GameData) => {
        setGameData(newData);
        saveToCloud(newData);
    };

    return {
        user,
        sessionId,
        gameData,
        isOnline,
        isLoadingRoom,
        syncing,
        permissionError,
        handleUpdate
    };
};