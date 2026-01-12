
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

export interface GameData {
  gameMode: GameMode;
  raceTo: number;
  unitPrice: number;
  tableBill: number;
  splitMode: SplitMode;
  history: HistoryEntry[];
  players1vs1: Player[];
  playersDen: Player[];
}

export interface PlayerColor {
  card: string;
  bar: string;
  btn: string;
  text: string;
  watermark: string;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface BillingData extends Player {
    tableShare: number;
    gameExchange?: number;
    total: number;
}

// Extend the Window interface for global objects from CDNs
declare global {
  interface Window {
    FirebaseCore: {
      initializeApp: (config: FirebaseConfig) => any;
    };
    FirebaseAuth: {
      getAuth: (app?: any) => any;
      signInAnonymously: (auth: any) => Promise<any>;
      onAuthStateChanged: (auth: any, callback: (user: any) => void) => () => void;
      signInWithCustomToken: (auth: any, token: string) => Promise<any>;
    };
    FirebaseStore: {
      getFirestore: (app?: any) => any;
      doc: (...args: any[]) => any;
      setDoc: (ref: any, data: any) => Promise<void>;
      onSnapshot: (ref: any, onNext: (snapshot: any) => void, onError?: (error: any) => void) => () => void;
      updateDoc: (ref: any, data: any) => Promise<void>;
    };
    confetti: (options: any) => void;
    __initial_auth_token?: string;
    __app_id?: string;
  }
}
