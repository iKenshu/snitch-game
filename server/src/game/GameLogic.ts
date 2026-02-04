import {
  GameState,
  Player,
  QUAFFLES_TO_WIN,
  MAX_SELECTABLE,
  VISIBLE_QUAFFLES
} from '../types/game.js';
import { generateQuaffleRow, refillQuaffleRow } from './QuaffleGenerator.js';

let playerIdCounter = 0;

export function generatePlayerId(): string {
  return `player_${Date.now()}_${++playerIdCounter}`;
}

export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createPlayer(socketId: string, name: string): Player {
  return {
    id: generatePlayerId(),
    socketId,
    sessionToken: generateSessionToken(),
    name,
    redQuaffles: 0,
    connectionStatus: 'connected',
  };
}

export function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    players: [],
    currentTurnPlayerId: null,
    status: 'waiting',
    winner: null,
    turnNumber: 0,
    sharedQuaffleRow: generateQuaffleRow(),
  };
}

export function addPlayerToGame(gameState: GameState, player: Player): GameState {
  if (gameState.players.length >= 2) {
    throw new Error('Game is full');
  }

  return {
    ...gameState,
    players: [...gameState.players, player],
  };
}

export function startGame(gameState: GameState): GameState {
  if (gameState.players.length !== 2) {
    throw new Error('Need exactly 2 players to start');
  }

  const firstPlayerIndex = Math.floor(Math.random() * 2);

  return {
    ...gameState,
    currentTurnPlayerId: gameState.players[firstPlayerIndex].id,
    status: 'playing',
    turnNumber: 1,
  };
}

export function validateQuaffleSelection(indices: number[]): { valid: boolean; error?: string } {
  if (indices.length === 0) {
    return { valid: false, error: 'Must select at least 1 quaffle' };
  }

  if (indices.length > MAX_SELECTABLE) {
    return { valid: false, error: `Cannot select more than ${MAX_SELECTABLE} quaffles` };
  }

  for (const index of indices) {
    if (index < 0 || index >= MAX_SELECTABLE) {
      return { valid: false, error: 'Can only select from the first 3 quaffles' };
    }
  }

  const uniqueIndices = new Set(indices);
  if (uniqueIndices.size !== indices.length) {
    return { valid: false, error: 'Cannot select the same quaffle twice' };
  }

  return { valid: true };
}

export function processQuaffleTake(
  gameState: GameState,
  playerId: string,
  indices: number[]
): { newState: GameState; error?: string } {
  if (gameState.currentTurnPlayerId !== playerId) {
    return { newState: gameState, error: 'Not your turn' };
  }

  if (gameState.status !== 'playing') {
    return { newState: gameState, error: 'Game is not in progress' };
  }

  const validation = validateQuaffleSelection(indices);
  if (!validation.valid) {
    return { newState: gameState, error: validation.error };
  }

  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { newState: gameState, error: 'Player not found' };
  }

  const player = gameState.players[playerIndex];

  const sortedIndices = [...indices].sort((a, b) => b - a);

  let redCount = 0;
  let newQuaffleRow = [...gameState.sharedQuaffleRow];

  for (const index of sortedIndices) {
    if (newQuaffleRow[index].type === 'red') {
      redCount++;
    }
    newQuaffleRow.splice(index, 1);
  }

  newQuaffleRow = refillQuaffleRow(newQuaffleRow, VISIBLE_QUAFFLES);

  const updatedPlayer: Player = {
    ...player,
    redQuaffles: player.redQuaffles + redCount,
  };

  const hasWon = updatedPlayer.redQuaffles >= QUAFFLES_TO_WIN;

  const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
  const nextPlayerId = gameState.players[otherPlayerIndex].id;

  const newPlayers = [...gameState.players];
  newPlayers[playerIndex] = updatedPlayer;

  const newState: GameState = {
    ...gameState,
    players: newPlayers,
    sharedQuaffleRow: newQuaffleRow,
    currentTurnPlayerId: hasWon ? null : nextPlayerId,
    status: hasWon ? 'finished' : 'playing',
    winner: hasWon ? playerId : null,
    turnNumber: gameState.turnNumber + 1,
  };

  return { newState };
}

export function getPlayerBySocketId(gameState: GameState, socketId: string): Player | undefined {
  return gameState.players.find(p => p.socketId === socketId);
}

export function removePlayerFromGame(gameState: GameState, playerId: string): GameState {
  return {
    ...gameState,
    players: gameState.players.filter(p => p.id !== playerId),
    status: 'finished',
    winner: null,
  };
}
