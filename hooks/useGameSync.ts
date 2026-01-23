
import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_GAME_DATA } from '../constants';
import { getSessionId } from '../utils';
import type { GameData, P2PMessage, RemoteCommand, ReactionData } from '../types';

const PEER_PREFIX = 'pst-v3-room-';

export const useGameSync = () => {
    const [sessionId, setSessionId] = useState(getSessionId());
    
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
    const [isHost, setIsHost] = useState(false);
    const [peerCount, setPeerCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    
    // New states for interaction
    const [lastReaction, setLastReaction] = useState<ReactionData | null>(null);
    const [pendingCommand, setPendingCommand] = useState<RemoteCommand | null>(null);

    const peerRef = useRef<any>(null);
    const connectionsRef = useRef<any[]>([]);
    
    // Helper to broadcast message to all connected peers
    const broadcast = useCallback((msg: P2PMessage) => {
        connectionsRef.current.forEach(conn => {
            if (conn.open) conn.send(msg);
        });
    }, []);

    useEffect(() => {
        const roomId = getSessionId();
        const peerId = `${PEER_PREFIX}${roomId}`;
        
        setIsLoadingRoom(true);
        setIsOnline(false);
        setIsHost(false);
        setPermissionError(false);
        connectionsRef.current = [];
        setPeerCount(0);

        if (!window.Peer) {
            setIsLoadingRoom(false);
            setIsHost(true); // Default to Host if PeerJS is not loaded (Offline Mode)
            return;
        }

        const initPeer = (attemptHost: boolean) => {
            if (peerRef.current) peerRef.current.destroy();

            const myId = attemptHost ? peerId : undefined;
            
            const peer = new window.Peer(myId, {
                debug: 1,
                config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
            });

            peer.on('open', (id: string) => {
                if (id === peerId) {
                    // HOST LOGIC
                    setIsHost(true);
                    setIsOnline(true);
                    setIsLoadingRoom(false);
                    try {
                        const saved = localStorage.getItem(`pst_session_${roomId}`);
                        if (saved) setGameData(JSON.parse(saved));
                    } catch {}
                } else {
                    // VIEWER LOGIC
                    setIsHost(false);
                    const conn = peer.connect(peerId);
                    
                    conn.on('open', () => {
                        setIsOnline(true);
                        setIsLoadingRoom(false);
                    });

                    conn.on('data', (msg: P2PMessage) => {
                        if (msg.type === 'GAME_DATA') {
                            setSyncing(true);
                            setGameData(msg.payload);
                            localStorage.setItem(`pst_session_${roomId}`, JSON.stringify(msg.payload));
                            setTimeout(() => setSyncing(false), 500);
                        } else if (msg.type === 'REACTION') {
                            setLastReaction(msg.payload);
                        }
                    });

                    conn.on('close', () => setIsOnline(false));
                    connectionsRef.current = [conn];
                }
            });

            peer.on('connection', (conn: any) => {
                // HOST ONLY: Handle incoming connections
                connectionsRef.current.push(conn);
                setPeerCount(prev => prev + 1);

                // Send initial data
                const currentLocal = localStorage.getItem(`pst_session_${roomId}`);
                if (currentLocal) {
                    const msg: P2PMessage = { type: 'GAME_DATA', payload: JSON.parse(currentLocal) };
                    conn.send(msg);
                }

                // Listen for messages FROM Viewers (Commands/Reactions)
                conn.on('data', (msg: P2PMessage) => {
                    if (msg.type === 'REACTION') {
                        // Display on Host
                        setLastReaction(msg.payload);
                        // Forward to other viewers (Broadcasting)
                        broadcast(msg); 
                    } else if (msg.type === 'COMMAND') {
                        // Queue command for App.tsx to execute
                        setPendingCommand(msg.payload);
                    }
                });

                conn.on('close', () => {
                    connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
                    setPeerCount(prev => Math.max(0, prev - 1));
                });
            });

            peer.on('error', (err: any) => {
                if (err.type === 'unavailable-id') {
                    initPeer(false); // ID taken, become Viewer
                } else {
                    if (err.type === 'browser-incompatible' || err.type === 'ssl-unavailable') {
                        setPermissionError(true);
                    }
                    setIsOnline(false);
                    setIsLoadingRoom(false);
                    setIsHost(true); // Fallback to Host on error (Offline Mode)
                }
            });

            peerRef.current = peer;
        };

        initPeer(true);

        const handleHashChange = () => setSessionId(getSessionId());
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            if (peerRef.current) peerRef.current.destroy();
        };
    }, [sessionId, broadcast]);

    // Function for Host to update game state
    const handleUpdate = useCallback((newData: GameData) => {
        setGameData(newData);
        localStorage.setItem(`pst_session_${sessionId}`, JSON.stringify(newData));
        if (isHost && isOnline) {
            setSyncing(true);
            broadcast({ type: 'GAME_DATA', payload: newData });
            setTimeout(() => setSyncing(false), 500);
        }
    }, [sessionId, isHost, isOnline, broadcast]);

    // Function to send reaction (Host or Viewer)
    const sendReaction = useCallback((emoji: string) => {
        const payload: ReactionData = { emoji, id: Date.now() };
        setLastReaction(payload); // Show locally immediately
        
        const msg: P2PMessage = { type: 'REACTION', payload };
        if (isHost) {
            broadcast(msg);
        } else if (isOnline && connectionsRef.current[0]) {
            connectionsRef.current[0].send(msg);
        }
    }, [isHost, isOnline, broadcast]);

    // Function for Viewer to send command
    const sendCommand = useCallback((cmd: RemoteCommand) => {
        if (!isOnline || isHost) return;
        const msg: P2PMessage = { type: 'COMMAND', payload: cmd };
        if (connectionsRef.current[0]) {
            connectionsRef.current[0].send(msg);
        }
    }, [isOnline, isHost]);

    return {
        sessionId,
        gameData,
        isOnline,
        isLoadingRoom,
        isHost,
        peerCount,
        handleUpdate,
        syncing,
        permissionError,
        lastReaction,
        sendReaction,
        pendingCommand,
        setPendingCommand, // To clear command after handling
        sendCommand
    };
};
        