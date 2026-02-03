import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  RoomResponse,
  JoinResponse,
} from '../types/game.js';
import {
  createRoom,
  getRoom,
  updateRoom,
  deleteRoom,
  getRoomBySocketId,
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

    // Create a new room
    socket.on('create_room', (playerName: string, callback: (response: RoomResponse) => void) => {
      try {
        const room = createRoom();
        const player = createPlayer(socket.id, playerName);

        room.gameState = addPlayerToGame(room.gameState, player);
        updateRoom(room.id, room.gameState);

        // Join the socket.io room
        socket.join(room.id);

        console.log(`Room ${room.id} created by ${playerName}`);

        callback({
          success: true,
          roomId: room.id,
          playerId: player.id,
        });

        // Send initial game state
        socket.emit('game_state', room.gameState);
      } catch (error) {
        console.error('Error creating room:', error);
        callback({
          success: false,
          error: 'Failed to create room',
        });
      }
    });

    // Join an existing room
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

        // Start the game since we have 2 players
        room.gameState = startGame(room.gameState);
        updateRoom(room.id, room.gameState);

        // Join the socket.io room
        socket.join(room.id);

        console.log(`${playerName} joined room ${room.id}`);

        callback({
          success: true,
          playerId: player.id,
          gameState: room.gameState,
        });

        // Notify both players that the game has started
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

    // Take quaffles
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

        // Broadcast updated game state to both players
        io.to(room.id).emit('game_update', newState);

        // Check if game is over
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

    // Leave room
    socket.on('leave_room', () => {
      handleDisconnect(socket, io);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      handleDisconnect(socket, io);
    });
  });
}

function handleDisconnect(
  socket: GameSocket,
  io: Server<ClientToServerEvents, ServerToClientEvents>
) {
  const room = getRoomBySocketId(socket.id);
  if (!room) return;

  const player = getPlayerBySocketId(room.gameState, socket.id);
  if (!player) return;

  console.log(`${player.name} left room ${room.id}`);

  // If game hasn't started or is finished, just delete the room
  if (room.gameState.players.length <= 1 || room.gameState.status === 'finished') {
    deleteRoom(room.id);
    return;
  }

  // Notify other player
  socket.to(room.id).emit('player_left', player.name);

  // End the game
  room.gameState = removePlayerFromGame(room.gameState, player.id);
  updateRoom(room.id, room.gameState);

  // If only one player left, they can stay in the room but game is over
  io.to(room.id).emit('game_update', room.gameState);
}
