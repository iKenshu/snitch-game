export type QuaffleType = 'red' | 'gray';

export interface Quaffle {
  id: string;
  type: QuaffleType;
}

export type PlayerConnectionStatus = 'connected' | 'disconnected';

export interface Player {
  id: string;
  socketId: string;
  sessionToken: string; // Token for reconnection (persists across socket changes)
  name: string;
  redQuaffles: number; // Progress towards victory (need 10)
  connectionStatus: PlayerConnectionStatus;
  disconnectedAt?: number; // Timestamp when disconnected
}

export interface Spectator {
  id: string;
  socketId: string;
  name: string;
  joinedAt: number;
}

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

export interface Room {
  id: string;
  gameState: GameState;
  spectators: Spectator[];
  createdAt: number;
}

export interface ClientToServerEvents {
  create_room: (playerName: string, callback: (response: RoomResponse) => void) => void;
  join_room: (roomId: string, playerName: string, callback: (response: JoinResponse) => void) => void;
  reconnect_game: (roomId: string, playerId: string, sessionToken: string, callback: (response: ReconnectResponse) => void) => void;
  take_quaffles: (indices: number[]) => void;
  leave_room: () => void;
  check_room: (roomId: string, callback: (response: RoomCheckResponse) => void) => void;
  join_as_spectator: (roomId: string, spectatorName: string, callback: (response: SpectatorJoinResponse) => void) => void;
}

export interface ServerToClientEvents {
  game_state: (state: GameState) => void;
  game_start: (state: GameState) => void;
  game_update: (state: GameState) => void;
  turn_change: (playerId: string) => void;
  game_over: (winnerId: string, winnerName: string) => void;
  player_left: (playerName: string) => void;
  player_disconnected: (playerName: string) => void;
  player_reconnected: (playerName: string) => void;
  error: (message: string) => void;
  spectator_joined: (spectatorName: string, spectatorCount: number) => void;
  spectator_left: (spectatorName: string, spectatorCount: number) => void;
}

export interface RoomResponse {
  success: boolean;
  roomId?: string;
  playerId?: string;
  sessionToken?: string;
  error?: string;
}

export interface JoinResponse {
  success: boolean;
  playerId?: string;
  sessionToken?: string;
  gameState?: GameState;
  error?: string;
}

export interface ReconnectResponse {
  success: boolean;
  gameState?: GameState;
  error?: string;
}

export interface RoomCheckResponse {
  exists: boolean;
  canJoinAsPlayer: boolean;
  canJoinAsSpectator: boolean;
  playerCount: number;
  spectatorCount: number;
  gameStatus: GameStatus | null;
}

export interface SpectatorJoinResponse {
  success: boolean;
  spectatorId?: string;
  gameState?: GameState;
  spectatorCount?: number;
  error?: string;
}

export const QUAFFLES_TO_WIN = 10;
export const VISIBLE_QUAFFLES = 20;
export const MAX_SELECTABLE = 3;
export const RED_QUAFFLE_PROBABILITY = 0.1;
export const MAX_SPECTATORS = 20;
export const RECONNECT_TIMEOUT_MS = 60000; // 60 seconds to reconnect
