import { Room, GameState, Spectator, MAX_SPECTATORS } from '../types/game.js';
import { createInitialGameState } from './GameLogic.js';

// In-memory storage for rooms
const rooms = new Map<string, Room>();

// Generate a short room code
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

  // Ensure unique room ID
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

// Clean up old abandoned rooms (rooms older than 1 hour with no activity)
export function cleanupOldRooms(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [roomId, room] of rooms.entries()) {
    if (room.createdAt < oneHourAgo && room.gameState.status === 'waiting') {
      rooms.delete(roomId);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldRooms, 30 * 60 * 1000);
