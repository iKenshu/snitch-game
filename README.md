# Snitch Capture

A multiplayer turn-based game where two players compete to collect 10 red quaffles first.

## How to Play

1. **Create or Join a Game**: One player creates a room and shares the 4-letter code with their opponent
2. **Take Quaffles**: On your turn, select 1-3 quaffles from the first 3 in your row
3. **Score Points**: Red quaffles = +1 point, Gray quaffles = 0 points
4. **Win**: First player to collect 10 red quaffles wins!

## Tech Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + Socket.io + TypeScript
- **Real-time**: WebSockets for multiplayer gameplay

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

Run both server and client in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server (port 3001)
npm run dev:server

# Terminal 2 - Client (port 5173)
npm run dev:client
```

Open http://localhost:5173 in your browser.

### Testing Multiplayer

1. Open http://localhost:5173 in two browser windows
2. In the first window, enter your name and click "Create Game"
3. Copy the 4-letter room code
4. In the second window, enter a name, paste the room code, and click "Join"
5. The game begins!

## Project Structure

```
snitch-game/
├── client/                 # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game.tsx       # Main game UI
│   │   │   ├── Lobby.tsx      # Create/Join room
│   │   │   ├── QuaffleRow.tsx # Quaffle display
│   │   │   └── PlayerProgress.tsx
│   │   ├── hooks/
│   │   │   └── useGameSocket.ts
│   │   ├── types/
│   │   │   └── game.ts
│   │   └── App.tsx
│   └── package.json
│
├── server/                 # Node + Express + Socket.io
│   ├── src/
│   │   ├── game/
│   │   │   ├── GameLogic.ts
│   │   │   ├── QuaffleGenerator.ts
│   │   │   └── RoomManager.ts
│   │   ├── socket/
│   │   │   └── handlers.ts
│   │   ├── types/
│   │   │   └── game.ts
│   │   └── index.ts
│   └── package.json
│
└── package.json            # Root scripts
```

## Game Rules

- Each player has their own infinite row of quaffles (20 visible at a time)
- On your turn, you must take 1-3 quaffles from the **first 3** in your row
- Red quaffles add 1 to your score
- Gray quaffles add nothing
- First to 10 red quaffles wins
- If a player disconnects, the game ends
