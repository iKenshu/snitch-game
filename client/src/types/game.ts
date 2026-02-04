export type QuaffleType = 'red' | 'gray';

export interface Quaffle {
  id: string;
  type: QuaffleType;
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  redQuaffles: number;
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
  sharedQuaffleRow: Quaffle[];
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
  error: (message: string) => void;
  spectator_joined: (spectatorName: string, spectatorCount: number) => void;
  spectator_left: (spectatorName: string, spectatorCount: number) => void;
}

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
