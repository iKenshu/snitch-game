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

export function createPlayer(socketId: string, name: string): Player {
  return {
    id: generatePlayerId(),
    socketId,
    name,
    redQuaffles: 0,
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

  // Randomly select who goes first
  const firstPlayerIndex = Math.floor(Math.random() * 2);

  return {
    ...gameState,
    currentTurnPlayerId: gameState.players[firstPlayerIndex].id,
    status: 'playing',
    turnNumber: 1,
  };
}

export function validateQuaffleSelection(indices: number[]): { valid: boolean; error?: string } {
  // Must select at least 1 quaffle
  if (indices.length === 0) {
    return { valid: false, error: 'Must select at least 1 quaffle' };
  }

  // Can't select more than MAX_SELECTABLE
  if (indices.length > MAX_SELECTABLE) {
    return { valid: false, error: `Cannot select more than ${MAX_SELECTABLE} quaffles` };
  }

  // All indices must be within first 3 (0, 1, 2)
  for (const index of indices) {
    if (index < 0 || index >= MAX_SELECTABLE) {
      return { valid: false, error: 'Can only select from the first 3 quaffles' };
    }
  }

  // No duplicates
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
  // Verify it's this player's turn
  if (gameState.currentTurnPlayerId !== playerId) {
    return { newState: gameState, error: 'Not your turn' };
  }

  // Verify game is in progress
  if (gameState.status !== 'playing') {
    return { newState: gameState, error: 'Game is not in progress' };
  }

  // Validate selection
  const validation = validateQuaffleSelection(indices);
  if (!validation.valid) {
    return { newState: gameState, error: validation.error };
  }

  // Find the player
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) {
    return { newState: gameState, error: 'Player not found' };
  }

  const player = gameState.players[playerIndex];

  // Sort indices in descending order to remove from end first (to preserve indices)
  const sortedIndices = [...indices].sort((a, b) => b - a);

  // Count red quaffles and remove selected quaffles from SHARED row
  let redCount = 0;
  let newQuaffleRow = [...gameState.sharedQuaffleRow];

  for (const index of sortedIndices) {
    if (newQuaffleRow[index].type === 'red') {
      redCount++;
    }
    newQuaffleRow.splice(index, 1);
  }

  // Refill the shared quaffle row
  newQuaffleRow = refillQuaffleRow(newQuaffleRow, VISIBLE_QUAFFLES);

  // Update player (only redQuaffles count)
  const updatedPlayer: Player = {
    ...player,
    redQuaffles: player.redQuaffles + redCount,
  };

  // Check for victory
  const hasWon = updatedPlayer.redQuaffles >= QUAFFLES_TO_WIN;

  // Get next player
  const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
  const nextPlayerId = gameState.players[otherPlayerIndex].id;

  // Create new players array
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
