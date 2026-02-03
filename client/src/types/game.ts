// Quaffle types
export type QuaffleType = 'red' | 'gray';

export interface Quaffle {
  id: string;
  type: QuaffleType;
}

// Player info
export interface Player {
  id: string;
  socketId: string;
  name: string;
  redQuaffles: number; // Progress towards victory (need 10)
}

// Game state
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameState {
  roomId: string;
  players: Player[];
  currentTurnPlayerId: string | null;
  status: GameStatus;
  winner: string | null;
  turnNumber: number;
  sharedQuaffleRow: Quaffle[]; // Shared row between both players
}

// Room
export interface Room {
  id: string;
  gameState: GameState;
  createdAt: number;
}

// Socket Events - Client to Server
export interface ClientToServerEvents {
  create_room: (playerName: string, callback: (response: RoomResponse) => void) => void;
  join_room: (roomId: string, playerName: string, callback: (response: JoinResponse) => void) => void;
  take_quaffles: (indices: number[]) => void;
  leave_room: () => void;
}

// Socket Events - Server to Client
export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  game_start: (state: GameState) => void;
  game_update: (state: GameState) => void;
  turn_change: (playerId: string) => void;
  game_over: (winnerId: string, winnerName: string) => void;
  player_left: (playerName: string) => void;
  error: (message: string) => void;
}

// Response types
export interface RoomResponse {
  success: boolean;
  roomId?: string;
  playerId?: string;
  error?: string;
}

export interface JoinResponse {
  success: boolean;
  playerId?: string;
  gameState?: GameState;
  error?: string;
}

// Game constants
export const QUAFFLES_TO_WIN = 10;
export const VISIBLE_QUAFFLES = 20;
export const MAX_SELECTABLE = 3;
export const RED_QUAFFLE_PROBABILITY = 0.1;
