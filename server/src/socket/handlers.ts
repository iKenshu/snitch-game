import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomResponse,
  JoinResponse,
  ReconnectResponse,
  RoomCheckResponse,
  SpectatorJoinResponse,
  Spectator,
  MAX_SPECTATORS,
} from '../types/game.js';
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomBySocketId,
  isSpectator,
  addSpectator,
  removeSpectator,
  findPlayerBySessionToken,
  updatePlayerSocketId,
  markPlayerDisconnected,
  setDisconnectTimeout,
  clearDisconnectTimeout,
} from '../game/RoomManager.js';
import {
  createPlayer,
  addPlayerToGame,
  startGame,
  processQuaffleTake,
  getPlayerBySocketId,
  removePlayerFromGame,
} from '../game/GameLogic.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  io.on('connection', (socket: GameSocket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('create_room', (playerName: string, callback: (response: RoomResponse) => void) => {
      try {
        const room = createRoom();
        const player = createPlayer(socket.id, playerName);

        room.gameState = addPlayerToGame(room.gameState, player);
        updateRoom(room.id, room.gameState);

        socket.join(room.id);

        console.log(`Room ${room.id} created by ${playerName}`);

        callback({
          success: true,
          roomId: room.id,
          playerId: player.id,
          sessionToken: player.sessionToken,
        });

        socket.emit('game_state', room.gameState);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({
          success: false,
          error: 'Failed to create room',
        });
      }
    });

    socket.on('join_room', (roomId: string, playerName: string, callback: (response: JoinResponse) => void) => {
      try {
        const room = getRoom(roomId);

        if (!room) {
          callback({
            success: false,
            error: 'Room not found',
          });
          return;
        }

        if (room.gameState.players.length >= 2) {
          callback({
            success: false,
            error: 'Room is full',
          });
          return;
        }

        if (room.gameState.status !== 'waiting') {
          callback({
            success: false,
            error: 'Game already in progress',
          });
          return;
        }

        const player = createPlayer(socket.id, playerName);
        room.gameState = addPlayerToGame(room.gameState, player);

        room.gameState = startGame(room.gameState);
        updateRoom(room.id, room.gameState);

        socket.join(room.id);

        console.log(`${playerName} joined room ${room.id}`);

        callback({
          success: true,
          playerId: player.id,
          sessionToken: player.sessionToken,
          gameState: room.gameState,
        });

        io.to(room.id).emit('game_start', room.gameState);
        io.to(room.id).emit('turn_change', room.gameState.currentTurnPlayerId!);
      } catch (error) {
        console.error('Error joining room:', error);
        callback({
          success: false,
          error: 'Failed to join room',
        });
      }
    });

    socket.on('reconnect_game', (roomId: string, playerId: string, sessionToken: string, callback: (response: ReconnectResponse) => void) => {
      try {
        const room = getRoom(roomId);

        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        const player = findPlayerBySessionToken(roomId, sessionToken);

        if (!player || player.id !== playerId) {
          callback({ success: false, error: 'Invalid session' });
          return;
        }

        clearDisconnectTimeout(playerId);
        updatePlayerSocketId(roomId, playerId, socket.id);
        socket.join(room.id);

        console.log(`${player.name} reconnected to room ${room.id}`);

        socket.to(room.id).emit('player_reconnected', player.name);

        callback({ success: true, gameState: room.gameState });
        socket.emit('game_state', room.gameState);
      } catch (error) {
        console.error('Error reconnecting:', error);
        callback({
          success: false,
          error: 'Failed to reconnect',
        });
      }
    });

    socket.on('take_quaffles', (indices: number[]) => {
      try {
        const room = getRoomBySocketId(socket.id);
        if (!room) {
          socket.emit('error', 'Not in a room');
          return;
        }

        const player = getPlayerBySocketId(room.gameState, socket.id);
        if (!player) {
          socket.emit('error', 'Player not found');
          return;
        }

        const { newState, error } = processQuaffleTake(room.gameState, player.id, indices);

        if (error) {
          socket.emit('error', error);
          return;
        }

        room.gameState = newState;
        updateRoom(room.id, newState);

        io.to(room.id).emit('game_update', newState);

        if (newState.status === 'finished' && newState.winner) {
          const winner = newState.players.find(p => p.id === newState.winner);
          if (winner) {
            io.to(room.id).emit('game_over', winner.id, winner.name);
          }
        } else if (newState.currentTurnPlayerId) {
          io.to(room.id).emit('turn_change', newState.currentTurnPlayerId);
        }
      } catch (error) {
        console.error('Error processing quaffle take:', error);
        socket.emit('error', 'Failed to process move');
      }
    });

    socket.on('check_room', (roomId: string, callback: (response: RoomCheckResponse) => void) => {
      const room = getRoom(roomId);

      if (!room) {
        callback({
          exists: false,
          canJoinAsPlayer: false,
          canJoinAsSpectator: false,
          playerCount: 0,
          spectatorCount: 0,
          gameStatus: null,
        });
        return;
      }

      const canJoinAsPlayer = room.gameState.players.length < 2 && room.gameState.status === 'waiting';
      const canJoinAsSpectator = room.spectators.length < MAX_SPECTATORS;

      callback({
        exists: true,
        canJoinAsPlayer,
        canJoinAsSpectator,
        playerCount: room.gameState.players.length,
        spectatorCount: room.spectators.length,
        gameStatus: room.gameState.status,
      });
    });

    socket.on('join_as_spectator', (roomId: string, spectatorName: string, callback: (response: SpectatorJoinResponse) => void) => {
      try {
        const room = getRoom(roomId);

        if (!room) {
          callback({ success: false, error: 'Room not found' });
          return;
        }

        if (room.spectators.length >= MAX_SPECTATORS) {
          callback({ success: false, error: 'Spectator limit reached' });
          return;
        }

        const spectator: Spectator = {
          id: `spectator_${Date.now()}_${socket.id}`,
          socketId: socket.id,
          name: spectatorName,
          joinedAt: Date.now(),
        };

        const added = addSpectator(room.id, spectator);
        if (!added) {
          callback({ success: false, error: 'Failed to add spectator' });
          return;
        }

        socket.join(room.id);

        console.log(`${spectatorName} joined as spectator in room ${room.id}`);

        io.to(room.id).emit('spectator_joined', spectatorName, room.spectators.length);

        callback({
          success: true,
          spectatorId: spectator.id,
          gameState: room.gameState,
          spectatorCount: room.spectators.length,
        });
      } catch (error) {
        console.error('Error joining as spectator:', error);
        callback({ success: false, error: 'Failed to join as spectator' });
      }
    });

    socket.on('leave_room', () => {
      handleDisconnect(socket, io, true);
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      handleDisconnect(socket, io, false);
    });
  });
}

function handleDisconnect(
  socket: GameSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  isIntentionalLeave: boolean = false
) {
  const room = getRoomBySocketId(socket.id);
  if (!room) return;

  if (isSpectator(socket.id)) {
    const spectator = removeSpectator(room.id, socket.id);
    if (spectator) {
      console.log(`Spectator ${spectator.name} left room ${room.id}`);
      io.to(room.id).emit('spectator_left', spectator.name, room.spectators.length);
    }
    return;
  }

  const player = getPlayerBySocketId(room.gameState, socket.id);
  if (!player) return;

  console.log(`${player.name} disconnected from room ${room.id}`);

  if (room.gameState.players.length <= 1 || room.gameState.status === 'finished') {
    deleteRoom(room.id);
    return;
  }

  if (isIntentionalLeave) {
    socket.to(room.id).emit('player_left', player.name);
    room.gameState = removePlayerFromGame(room.gameState, player.id);
    updateRoom(room.id, room.gameState);
    io.to(room.id).emit('game_update', room.gameState);
    return;
  }

  markPlayerDisconnected(room.id, player.id);
  socket.to(room.id).emit('player_disconnected', player.name);

  setDisconnectTimeout(player.id, () => {
    const currentRoom = getRoom(room.id);
    if (!currentRoom) return;

    const currentPlayer = currentRoom.gameState.players.find(p => p.id === player.id);
    if (!currentPlayer || currentPlayer.connectionStatus === 'connected') return;

    console.log(`${player.name} failed to reconnect, removing from room ${room.id}`);

    io.to(room.id).emit('player_left', player.name);
    currentRoom.gameState = removePlayerFromGame(currentRoom.gameState, player.id);
    updateRoom(room.id, currentRoom.gameState);
    io.to(room.id).emit('game_update', currentRoom.gameState);
  });
}
