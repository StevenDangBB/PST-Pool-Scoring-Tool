
export interface Player {
  id: number;
  name: string;
  score: number;
  personal: number;
  colorIdx: number;
}

export interface HistoryEntry {
  id: number;
  time: string;
  text: string;
  type: HistoryFilter;
  snapshot: string | { n: string; s: number }[];
}

export type GameMode = '1vs1' | 'den';
export type SplitMode = '73' | 'equal';
export type HistoryFilter = 'all' | 'score' | 'balance' | 'system' | 'info';
export type Theme = 'light' | 'dark';

export interface ShotClockState {
    seconds: number;
    initialSeconds: number; // 30 or 60
    isRunning: boolean;
    extensions: { [playerId: number]: number }; // Count extensions used
}

export interface GameData {
  gameMode: GameMode;
  raceTo: number;
  unitPrice: number;
  tableBill: number;
  splitMode: SplitMode;
  history: HistoryEntry[];
  players1vs1: Player[];
  playersDen: Player[];
  shotClock: ShotClockState;
}

export interface PlayerColor {
  card: string;
  bar: string;
  btn: string;
  text: string;
  watermark: string;
}

export interface BillingData extends Player {
    tableShare: number;
    gameExchange?: number;
    total: number;
}

// P2P Protocol Types
export type P2PMessageType = 'GAME_DATA' | 'REACTION' | 'COMMAND';

export interface P2PMessage {
    type: P2PMessageType;
    payload: any;
}

export interface RemoteCommand {
    action: 'SCORE' | 'CLOCK';
    mode?: '1vs1' | 'den';
    id?: number;
    delta?: number;
    clockAction?: 'START' | 'STOP' | 'RESET' | 'EXT' | 'SET_TIME';
    clockValue?: number;
}

export interface ReactionData {
    emoji: string;
    id: number;
    senderId?: string;
}

declare global {
  interface Window {
    Peer: any;
    confetti: (options: any) => void;
    __app_id?: string;
  }
}
