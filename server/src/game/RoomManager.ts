import { Room, GameState, Spectator, Player, MAX_SPECTATORS, RECONNECT_TIMEOUT_MS } from '../types/game.js';
import { createInitialGameState } from './GameLogic.js';

const rooms = new Map<string, Room>();

const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createRoom(): Room {
  let roomId = generateRoomId();

  while (rooms.has(roomId)) {
    roomId = generateRoomId();
  }

  const room: Room = {
    id: roomId,
    gameState: createInitialGameState(roomId),
    spectators: [],
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId.toUpperCase());
}

export function updateRoom(roomId: string, gameState: GameState): void {
  const room = rooms.get(roomId);
  if (room) {
    room.gameState = gameState;
  }
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.gameState.players.some(p => p.socketId === socketId)) {
      return room;
    }
    if (room.spectators.some(s => s.socketId === socketId)) {
      return room;
    }
  }
  return undefined;
}

export function isSpectator(socketId: string): boolean {
  for (const room of rooms.values()) {
    if (room.spectators.some(s => s.socketId === socketId)) {
      return true;
    }
  }
  return false;
}

export function addSpectator(roomId: string, spectator: Spectator): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  if (room.spectators.length >= MAX_SPECTATORS) return false;

  room.spectators.push(spectator);
  return true;
}

export function removeSpectator(roomId: string, socketId: string): Spectator | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  const index = room.spectators.findIndex(s => s.socketId === socketId);
  if (index === -1) return undefined;

  const [removed] = room.spectators.splice(index, 1);
  return removed;
}

export function getSpectatorCount(roomId: string): number {
  const room = rooms.get(roomId);
  return room?.spectators.length ?? 0;
}

export function findPlayerBySessionToken(roomId: string, sessionToken: string): Player | undefined {
  const room = rooms.get(roomId.toUpperCase());
  if (!room) return undefined;
  return room.gameState.players.find(p => p.sessionToken === sessionToken);
}

export function updatePlayerSocketId(roomId: string, playerId: string, newSocketId: string): boolean {
  const room = rooms.get(roomId.toUpperCase());
  if (!room) return false;

  const player = room.gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  player.socketId = newSocketId;
  player.connectionStatus = 'connected';
  player.disconnectedAt = undefined;
  return true;
}

export function markPlayerDisconnected(roomId: string, playerId: string): boolean {
  const room = rooms.get(roomId.toUpperCase());
  if (!room) return false;

  const player = room.gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  player.connectionStatus = 'disconnected';
  player.disconnectedAt = Date.now();
  return true;
}

export function setDisconnectTimeout(
  playerId: string,
  onTimeout: () => void
): void {
  clearDisconnectTimeout(playerId);

  const timeout = setTimeout(onTimeout, RECONNECT_TIMEOUT_MS);
  disconnectTimeouts.set(playerId, timeout);
}

export function clearDisconnectTimeout(playerId: string): boolean {
  const timeout = disconnectTimeouts.get(playerId);
  if (timeout) {
    clearTimeout(timeout);
    disconnectTimeouts.delete(playerId);
    return true;
  }
  return false;
}

export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function cleanupOldRooms(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [roomId, room] of rooms.entries()) {
    if (room.createdAt < oneHourAgo && room.gameState.status === 'waiting') {
      rooms.delete(roomId);
    }
  }
}

setInterval(cleanupOldRooms, 30 * 60 * 1000);
