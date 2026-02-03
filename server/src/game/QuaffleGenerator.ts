import { Quaffle, QuaffleType, RED_QUAFFLE_PROBABILITY, VISIBLE_QUAFFLES } from '../types/game.js';

let quaffleIdCounter = 0;

export function generateQuaffleId(): string {
  return `q_${Date.now()}_${++quaffleIdCounter}`;
}

export function generateQuaffle(): Quaffle {
  const type: QuaffleType = Math.random() < RED_QUAFFLE_PROBABILITY ? 'red' : 'gray';
  return {
    id: generateQuaffleId(),
    type,
  };
}

export function generateQuaffleRow(count: number = VISIBLE_QUAFFLES): Quaffle[] {
  const row: Quaffle[] = [];
  for (let i = 0; i < count; i++) {
    row.push(generateQuaffle());
  }
  return row;
}

export function refillQuaffleRow(currentRow: Quaffle[], targetCount: number = VISIBLE_QUAFFLES): Quaffle[] {
  const newRow = [...currentRow];
  while (newRow.length < targetCount) {
    newRow.push(generateQuaffle());
  }
  return newRow;
}
