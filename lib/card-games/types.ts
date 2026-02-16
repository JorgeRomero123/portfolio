export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type GameType = 'poker' | 'blackjack';

export type PokerRound = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PokerActionType = 'fold' | 'check' | 'call' | 'raise' | 'all-in';

export interface PokerAction {
  type: PokerActionType;
  amount?: number;
  playerId: string;
}

export type HandRankValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface HandEvaluation {
  rankValue: HandRankValue;
  rankName: string;
  kickers: number[];
  bestCards: Card[];
  description: string;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  totalBetThisRound: number;
  totalBetThisHand: number;
  folded: boolean;
  allIn: boolean;
  sittingOut: boolean;
  connected: boolean;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface GameState {
  round: PokerRound;
  communityCards: Card[];
  deck: Card[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  minRaise: number;
  dealerIndex: number;
  activePlayerIndex: number;
  lastRaiserIndex: number;
  players: Player[];
  handNumber: number;
  gameLog: string[];
  winners: {
    playerId: string;
    playerName: string;
    amount: number;
    hand: HandEvaluation;
  }[] | null;
  handInProgress: boolean;
}

export interface RoomConfig {
  gameType: GameType;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  betAmount: number;
  maxPlayers: number;
}

export interface Room {
  code: string;
  hostId: string;
  config: RoomConfig;
  gameState: GameState | null;
  players: Player[];
  started: boolean;
}

export interface FilteredPlayer {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[] | null; // null = hidden
  cardCount: number;
  totalBetThisRound: number;
  totalBetThisHand: number;
  folded: boolean;
  allIn: boolean;
  sittingOut: boolean;
  connected: boolean;
}

export interface FilteredGameState {
  gameType: 'poker';
  round: PokerRound;
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  minRaise: number;
  dealerIndex: number;
  activePlayerIndex: number;
  players: FilteredPlayer[];
  handNumber: number;
  gameLog: string[];
  winners: GameState['winners'];
  handInProgress: boolean;
  validActions: PokerActionType[];
  callAmount: number;
  minRaiseTotal: number;
  maxRaiseTotal: number;
}

// Blackjack types

export type BlackjackActionType = 'hit' | 'stand' | 'double' | 'split';

export interface BlackjackAction {
  type: BlackjackActionType;
  playerId: string;
}

export interface BlackjackHand {
  cards: Card[];
  bet: number;
  stood: boolean;
  busted: boolean;
  isBlackjack: boolean;
  result: 'win' | 'lose' | 'push' | 'blackjack' | null;
  payout: number;
}

export interface BlackjackPlayer {
  id: string;
  name: string;
  chips: number;
  hands: BlackjackHand[];
  activeHandIndex: number;
  connected: boolean;
}

export type BlackjackPhase = 'playing' | 'dealer' | 'resolved';

export interface BlackjackGameState {
  phase: BlackjackPhase;
  deck: Card[];
  dealerCards: Card[];
  dealerRevealed: boolean;
  players: BlackjackPlayer[];
  activePlayerIndex: number;
  handNumber: number;
  gameLog: string[];
  winners: {
    playerId: string;
    playerName: string;
    amount: number;
    hand: { description: string };
  }[] | null;
  handInProgress: boolean;
  betAmount: number;
}

export interface FilteredBlackjackPlayer {
  id: string;
  name: string;
  chips: number;
  hands: BlackjackHand[];
  activeHandIndex: number;
  connected: boolean;
}

export interface FilteredBlackjackState {
  gameType: 'blackjack';
  phase: BlackjackPhase;
  dealerCards: (Card | null)[];
  dealerTotal: number | null;
  players: FilteredBlackjackPlayer[];
  activePlayerIndex: number;
  handNumber: number;
  gameLog: string[];
  winners: BlackjackGameState['winners'];
  handInProgress: boolean;
  validActions: BlackjackActionType[];
  betAmount: number;
}

export type FilteredAnyGameState = FilteredGameState | FilteredBlackjackState;

export interface BroadcastPayload {
  channel: string;
  playerStates: Record<string, FilteredAnyGameState>;
}
