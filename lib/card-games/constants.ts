import { RoomConfig } from './types';

export const DEFAULT_CONFIG: RoomConfig = {
  gameType: 'poker',
  startingChips: 1000,
  smallBlind: 10,
  bigBlind: 20,
  betAmount: 20,
  maxPlayers: 8,
};

export const ROOM_CODE_LENGTH = 6;
export const WINNER_OVERLAY_DURATION = 4000;
export const MIN_PLAYERS_TO_START = 2;
export const MIN_BLACKJACK_PLAYERS = 1;
