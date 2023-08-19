export const commands = [
  'help',
  'create',
  'start',
  'join',
  'lobby',
  'hit',
  'stand',
  'show',
  'quit',
  'yes',
  'no',
];

export const gameCreated = [
  'start',
  'join',
  'lobby',
  'hit',
  'stand',
  'show',
  'quit',
  'yes',
  'no',
];

export const gameStart = ['hit', 'stand', 'show', 'yes', 'no'];

export const resetTimer = ['hit', 'stand', 'yes', 'no'];

export const playerTurn = ['hit', 'stand'];

export const commandInstruction = {
  create: 'create a blackjack game',
  start: 'start round',
  join: 'join to blackjack game',
  lobby: 'show player on the game',
  hit: 'draw a card',
  stand: 'end your turn',
  show: 'show table card',
  quit: 'leave the game',
};
