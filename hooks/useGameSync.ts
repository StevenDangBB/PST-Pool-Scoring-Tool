import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_GAME_DATA } from '../constants';
import { getSessionId } from '../utils';
import type { GameData } from '../types';

// Prefix to ensure we don't collide with other random PeerJS users
const PEER_PREFIX = 'pst-v3-room-';

export const useGameSync = () => {
    const [sessionId, setSessionId] = useState(getSessionId());
    
    // Determine data from LocalStorage first (Optimistic Load)
    const [gameData, setGameData] = useState<GameData>(() => {
        try {
            const saved = localStorage.getItem(`pst_session_${getSessionId()}`);
            return saved ? JSON.parse(saved) : DEFAULT_GAME_DATA;
        } catch {
            return DEFAULT_GAME_DATA;
        }
    });

    const [isOnline, setIsOnline] = useState(false);
    const [isLoadingRoom, setIsLoadingRoom] = useState(true);
    const [isHost, setIsHost] = useState(false); // New: Tracks if this user owns the room
    const [peerCount, setPeerCount] = useState(0);

    const peerRef = useRef<any>(null);
    const connectionsRef = useRef<any[]>([]);
    
    // 1. Initialize P2P Connection
    useEffect(() => {
        const roomId = getSessionId();
        const peerId = `${PEER_PREFIX}${roomId}`;
        
        setIsLoadingRoom(true);
        setIsOnline(false);
        setIsHost(false);
        connectionsRef.current = [];
        setPeerCount(0);

        if (!window.Peer) {
            console.error("PeerJS not loaded");
            setIsLoadingRoom(false);
            return;
        }

        // --- STRATEGY: Try to be the HOST first ---
        // If we can grab the ID PEER_PREFIX + roomId, we are the Host.
        // If that ID is taken, PeerJS will error, and we fallback to being a Viewer.

        const initPeer = (attemptHost: boolean) => {
            if (peerRef.current) peerRef.current.destroy();

            const myId = attemptHost ? peerId : undefined; // Undefined = random ID for viewer
            
            const peer = new window.Peer(myId, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:global.stun.twilio.com:3478' }
                    ]
                }
            });

            peer.on('open', (id: string) => {
                console.log('Peer Opened. My ID:', id);
                
                if (id === peerId) {
                    // WE ARE HOST
                    setIsHost(true);
                    setIsOnline(true);
                    setIsLoadingRoom(false);
                    // Load latest local data as authority
                    try {
                        const saved = localStorage.getItem(`pst_session_${roomId}`);
                        if (saved) setGameData(JSON.parse(saved));
                    } catch {}
                } else {
                    // WE ARE VIEWER
                    setIsHost(false);
                    // Connect to Host
                    const conn = peer.connect(peerId);
                    
                    conn.on('open', () => {
                        console.log("Connected to Host!");
                        setIsOnline(true);
                        setIsLoadingRoom(false);
                    });

                    conn.on('data', (data: GameData) => {
                        // Received update from Host
                        console.log("Received Data from Host");
                        setGameData(data);
                        localStorage.setItem(`pst_session_${roomId}`, JSON.stringify(data));
                    });

                    conn.on('close', () => {
                        console.warn("Host disconnected");
                        setIsOnline(false);
                    });
                    
                    connectionsRef.current = [conn];
                }
            });

            peer.on('connection', (conn: any) => {
                // (HOST ONLY) A viewer connected
                console.log("New Viewer Connected");
                connectionsRef.current.push(conn);
                setPeerCount(prev => prev + 1);

                // Send current data immediately
                // Need to use current state, but inside callback usage is tricky.
                // We trust the localStorage or the Ref if we had one, but simple approach:
                // We queue a send or just wait for next update. 
                // Better: Send immediately what we have in the state variable (via closure might be stale, but okay for init)
                // To fix stale closure, we can just save to LS and read from LS to send, or just wait for next interaction.
                // Let's try to send what's in LocalStorage to be safe.
                const currentLocal = localStorage.getItem(`pst_session_${roomId}`);
                if (currentLocal) {
                    conn.send(JSON.parse(currentLocal));
                }

                conn.on('close', () => {
                    connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
                    setPeerCount(prev => Math.max(0, prev - 1));
                });
            });

            peer.on('error', (err: any) => {
                console.log("Peer Error:", err.type);
                if (err.type === 'unavailable-id') {
                    // ID taken, meaning Host exists. Become Viewer.
                    console.log("Room ID taken, switching to Viewer mode...");
                    initPeer(false); // Retry as viewer (random ID)
                } else {
                    console.error(err);
                    setIsOnline(false);
                    setIsLoadingRoom(false);
                }
            });

            peerRef.current = peer;
        };

        // Start by attempting to be Host
        initPeer(true);

        const handleHashChange = () => {
            setSessionId(getSessionId());
            // Trigger re-render to re-run effect
        };
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            if (peerRef.current) peerRef.current.destroy();
        };
    }, [sessionId]);

    const handleUpdate = useCallback((newData: GameData) => {
        // Optimistic Update
        setGameData(newData);
        localStorage.setItem(`pst_session_${sessionId}`, JSON.stringify(newData));

        // If Host, broadcast to all viewers
        if (isHost && isOnline && connectionsRef.current.length > 0) {
            connectionsRef.current.forEach(conn => {
                if (conn.open) {
                    conn.send(newData);
                }
            });
        }
    }, [sessionId, isHost, isOnline]);

    return {
        user: { uid: isHost ? 'HOST' : 'VIEWER' }, // Mock user for UI compatibility
        sessionId,
        gameData,
        isOnline,
        isLoadingRoom,
        syncing: false, // P2P is instant, no sync loading state usually needed
        permissionError: false,
        handleUpdate,
        isHost,    // Exported so UI can disable controls for Viewers
        peerCount  // Exported so Host knows how many are watching
    };
};