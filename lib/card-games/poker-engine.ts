import { Card, GameState, Player, PokerAction, PokerRound, SidePot, RoomConfig, PokerActionType } from './types';
import { createDeck, shuffle, deal } from './cards';
import { evaluateHand, compareHands } from './hand-evaluator';

export function initializeHand(players: Player[], config: RoomConfig, prevDealerIndex: number): GameState {
  const activePlayers = players.filter(p => p.chips > 0 && !p.sittingOut);
  if (activePlayers.length < 2) {
    throw new Error('Need at least 2 players with chips');
  }

  // Reset player hand state
  for (const p of players) {
    p.holeCards = [];
    p.totalBetThisRound = 0;
    p.totalBetThisHand = 0;
    p.folded = p.chips === 0 || p.sittingOut;
    p.allIn = false;
  }

  const deck = shuffle(createDeck());
  const dealerIndex = nextActiveIndex(players, prevDealerIndex);
  const sbIndex = players.length === 2 ? dealerIndex : nextActiveIndex(players, dealerIndex);
  const bbIndex = nextActiveIndex(players, sbIndex);

  // Post blinds
  const sbAmount = Math.min(config.smallBlind, players[sbIndex].chips);
  const bbAmount = Math.min(config.bigBlind, players[bbIndex].chips);

  players[sbIndex].chips -= sbAmount;
  players[sbIndex].totalBetThisRound = sbAmount;
  players[sbIndex].totalBetThisHand = sbAmount;
  if (players[sbIndex].chips === 0) players[sbIndex].allIn = true;

  players[bbIndex].chips -= bbAmount;
  players[bbIndex].totalBetThisRound = bbAmount;
  players[bbIndex].totalBetThisHand = bbAmount;
  if (players[bbIndex].chips === 0) players[bbIndex].allIn = true;

  // Deal 2 hole cards to each active player
  let currentDeck = deck;
  for (const p of players) {
    if (!p.folded) {
      const { cards, remaining } = deal(currentDeck, 2);
      p.holeCards = cards;
      currentDeck = remaining;
    }
  }

  const activeIndex = nextActiveIndex(players, bbIndex);

  const gameLog = [
    `--- Hand #${1} ---`,
    `${players[dealerIndex].name} is the dealer`,
    `${players[sbIndex].name} posts small blind (${sbAmount})`,
    `${players[bbIndex].name} posts big blind (${bbAmount})`,
  ];

  return {
    round: 'preflop',
    communityCards: [],
    deck: currentDeck,
    pot: sbAmount + bbAmount,
    sidePots: [],
    currentBet: bbAmount,
    minRaise: config.bigBlind,
    dealerIndex,
    activePlayerIndex: activeIndex,
    lastRaiserIndex: activeIndex,
    players,
    handNumber: 1,
    gameLog,
    winners: null,
    handInProgress: true,
  };
}

function nextActiveIndex(players: Player[], fromIndex: number): number {
  let idx = (fromIndex + 1) % players.length;
  let safety = 0;
  while ((players[idx].folded || players[idx].allIn || players[idx].chips === 0 && players[idx].holeCards.length === 0) && safety < players.length) {
    idx = (idx + 1) % players.length;
    safety++;
  }
  return idx;
}

function countActivePlayers(players: Player[]): number {
  return players.filter(p => !p.folded).length;
}

function countPlayersWhoCanAct(players: Player[]): number {
  return players.filter(p => !p.folded && !p.allIn).length;
}

function isRoundComplete(state: GameState): boolean {
  const { players, activePlayerIndex, lastRaiserIndex } = state;

  const canAct = countPlayersWhoCanAct(players);
  if (canAct === 0) return true;
  if (countActivePlayers(players) <= 1) return true;

  // Everyone who can act has matched the current bet or checked
  const activeBettors = players.filter(p => !p.folded && !p.allIn);
  const allMatched = activeBettors.every(p => p.totalBetThisRound === state.currentBet);
  if (allMatched && activePlayerIndex === lastRaiserIndex) return true;

  return false;
}

export function getValidActions(state: GameState): { actions: PokerActionType[]; callAmount: number; minRaiseTotal: number; maxRaiseTotal: number } {
  const player = state.players[state.activePlayerIndex];
  if (!player || player.folded || player.allIn) {
    return { actions: [], callAmount: 0, minRaiseTotal: 0, maxRaiseTotal: 0 };
  }

  const actions: PokerActionType[] = ['fold'];
  const toCall = state.currentBet - player.totalBetThisRound;

  if (toCall === 0) {
    actions.push('check');
  } else {
    if (player.chips > toCall) {
      actions.push('call');
    }
  }

  const minRaiseTotal = state.currentBet + state.minRaise;
  const maxRaiseTotal = player.totalBetThisRound + player.chips;

  if (maxRaiseTotal > state.currentBet && player.chips > toCall) {
    actions.push('raise');
  }

  // All-in is always available if the player has chips
  if (player.chips > 0) {
    actions.push('all-in');
  }

  return {
    actions,
    callAmount: Math.min(toCall, player.chips),
    minRaiseTotal: Math.min(minRaiseTotal, maxRaiseTotal),
    maxRaiseTotal,
  };
}

export function processAction(state: GameState, action: PokerAction): GameState {
  const newState = { ...state, players: state.players.map(p => ({ ...p })), gameLog: [...state.gameLog] };
  const playerIdx = newState.players.findIndex(p => p.id === action.playerId);
  if (playerIdx === -1 || playerIdx !== newState.activePlayerIndex) return newState;

  const player = newState.players[playerIdx];

  switch (action.type) {
    case 'fold': {
      player.folded = true;
      newState.gameLog.push(`${player.name} folds`);
      break;
    }
    case 'check': {
      newState.gameLog.push(`${player.name} checks`);
      break;
    }
    case 'call': {
      const toCall = Math.min(newState.currentBet - player.totalBetThisRound, player.chips);
      player.chips -= toCall;
      player.totalBetThisRound += toCall;
      player.totalBetThisHand += toCall;
      newState.pot += toCall;
      if (player.chips === 0) player.allIn = true;
      newState.gameLog.push(`${player.name} calls ${toCall}`);
      break;
    }
    case 'raise': {
      const raiseTotal = action.amount!;
      const toAdd = raiseTotal - player.totalBetThisRound;
      const actualAdd = Math.min(toAdd, player.chips);
      player.chips -= actualAdd;
      const actualTotal = player.totalBetThisRound + actualAdd;
      newState.minRaise = actualTotal - newState.currentBet;
      newState.currentBet = actualTotal;
      player.totalBetThisRound = actualTotal;
      player.totalBetThisHand += actualAdd;
      newState.pot += actualAdd;
      newState.lastRaiserIndex = playerIdx;
      if (player.chips === 0) player.allIn = true;
      newState.gameLog.push(`${player.name} raises to ${actualTotal}`);
      break;
    }
    case 'all-in': {
      const allInAmount = player.chips;
      player.totalBetThisRound += allInAmount;
      player.totalBetThisHand += allInAmount;
      newState.pot += allInAmount;
      player.chips = 0;
      player.allIn = true;
      if (player.totalBetThisRound > newState.currentBet) {
        newState.minRaise = player.totalBetThisRound - newState.currentBet;
        newState.currentBet = player.totalBetThisRound;
        newState.lastRaiserIndex = playerIdx;
        newState.gameLog.push(`${player.name} goes all-in for ${player.totalBetThisRound} (raise)`);
      } else {
        newState.gameLog.push(`${player.name} goes all-in for ${player.totalBetThisRound}`);
      }
      break;
    }
  }

  // Check if only one player remains (everyone else folded)
  if (countActivePlayers(newState.players) === 1) {
    return resolveLastPlayerStanding(newState);
  }

  // Advance to next player
  newState.activePlayerIndex = nextActiveIndex(newState.players, playerIdx);

  // Check if betting round is complete
  if (isRoundComplete(newState)) {
    return advanceRound(newState);
  }

  return newState;
}

function advanceRound(state: GameState): GameState {
  const newState = { ...state, players: state.players.map(p => ({ ...p })) };

  // Reset per-round bets
  for (const p of newState.players) {
    p.totalBetThisRound = 0;
  }
  newState.currentBet = 0;
  newState.minRaise = newState.players[0]?.totalBetThisHand ? 20 : 20; // reset to big blind

  const roundOrder: PokerRound[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  const currentIdx = roundOrder.indexOf(newState.round);

  // If only all-in players + 1 or fewer can act, deal remaining community cards
  if (countPlayersWhoCanAct(newState.players) <= 1 && countActivePlayers(newState.players) > 1) {
    // Run out remaining cards
    return runOutRemainingCards(newState);
  }

  const nextRound = roundOrder[currentIdx + 1];
  newState.round = nextRound;

  if (nextRound === 'flop') {
    const { cards, remaining } = deal(newState.deck, 3);
    newState.communityCards = [...newState.communityCards, ...cards];
    newState.deck = remaining;
    newState.gameLog.push(`--- Flop: ${cardsToString(cards)} ---`);
  } else if (nextRound === 'turn') {
    const { cards, remaining } = deal(newState.deck, 1);
    newState.communityCards = [...newState.communityCards, ...cards];
    newState.deck = remaining;
    newState.gameLog.push(`--- Turn: ${cardsToString(cards)} ---`);
  } else if (nextRound === 'river') {
    const { cards, remaining } = deal(newState.deck, 1);
    newState.communityCards = [...newState.communityCards, ...cards];
    newState.deck = remaining;
    newState.gameLog.push(`--- River: ${cardsToString(cards)} ---`);
  } else if (nextRound === 'showdown') {
    return resolveShowdown(newState);
  }

  // Set first active player after dealer
  newState.activePlayerIndex = nextActiveIndex(newState.players, newState.dealerIndex);
  newState.lastRaiserIndex = newState.activePlayerIndex;

  return newState;
}

function runOutRemainingCards(state: GameState): GameState {
  const newState = { ...state, gameLog: [...state.gameLog] };
  let deck = [...newState.deck];
  const community = [...newState.communityCards];

  if (community.length < 3) {
    const { cards, remaining } = deal(deck, 3 - community.length);
    community.push(...cards);
    deck = remaining;
    newState.gameLog.push(`--- Flop: ${cardsToString(community.slice(0, 3))} ---`);
  }
  if (community.length < 4) {
    const { cards, remaining } = deal(deck, 1);
    community.push(...cards);
    deck = remaining;
    newState.gameLog.push(`--- Turn: ${cardsToString([community[3]])} ---`);
  }
  if (community.length < 5) {
    const { cards, remaining } = deal(deck, 1);
    community.push(...cards);
    deck = remaining;
    newState.gameLog.push(`--- River: ${cardsToString([community[4]])} ---`);
  }

  newState.communityCards = community;
  newState.deck = deck;
  newState.round = 'showdown';

  return resolveShowdown(newState);
}

function resolveLastPlayerStanding(state: GameState): GameState {
  const winner = state.players.find(p => !p.folded)!;
  winner.chips += state.pot;

  state.winners = [{
    playerId: winner.id,
    playerName: winner.name,
    amount: state.pot,
    hand: { rankValue: 0 as never, rankName: 'Last Player Standing', kickers: [], bestCards: [], description: 'Everyone else folded' },
  }];
  state.pot = 0;
  state.handInProgress = false;
  state.gameLog.push(`${winner.name} wins ${state.winners[0].amount} (everyone else folded)`);

  return state;
}

function resolveShowdown(state: GameState): GameState {
  const newState = { ...state, gameLog: [...state.gameLog] };
  const activePlayers = newState.players.filter(p => !p.folded);

  // Calculate side pots
  const pots = calculateSidePots(newState.players);
  newState.gameLog.push('--- Showdown ---');

  const allWinners: GameState['winners'] = [];

  for (const pot of pots) {
    const eligible = activePlayers.filter(p => pot.eligiblePlayerIds.includes(p.id));
    const evaluated = eligible.map(p => ({
      player: p,
      hand: evaluateHand(p.holeCards, newState.communityCards),
    }));

    evaluated.sort((a, b) => compareHands(b.hand, a.hand));

    // Find all players tied for best hand
    const bestHand = evaluated[0].hand;
    const winners = evaluated.filter(e => compareHands(e.hand, bestHand) === 0);
    const share = Math.floor(pot.amount / winners.length);
    let remainder = pot.amount - share * winners.length;

    for (const w of winners) {
      const amount = share + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
      w.player.chips += amount;
      allWinners.push({
        playerId: w.player.id,
        playerName: w.player.name,
        amount,
        hand: w.hand,
      });
      newState.gameLog.push(`${w.player.name} wins ${amount} with ${w.hand.description}`);
    }
  }

  // Log all hands
  for (const p of activePlayers) {
    const hand = evaluateHand(p.holeCards, newState.communityCards);
    newState.gameLog.push(`${p.name} shows ${cardsToString(p.holeCards)} (${hand.description})`);
  }

  newState.winners = allWinners;
  newState.pot = 0;
  newState.sidePots = [];
  newState.handInProgress = false;

  return newState;
}

function calculateSidePots(players: Player[]): SidePot[] {
  const activePlayers = players.filter(p => !p.folded && p.totalBetThisHand > 0);
  if (activePlayers.length === 0) return [];

  // Get unique bet levels
  const betLevels = [...new Set(activePlayers.map(p => p.totalBetThisHand))].sort((a, b) => a - b);

  const pots: SidePot[] = [];
  let prevLevel = 0;

  for (const level of betLevels) {
    const increment = level - prevLevel;
    if (increment <= 0) continue;

    // All players who contributed at least this level
    const contributors = players.filter(p => p.totalBetThisHand >= level);
    const eligible = contributors.filter(p => !p.folded);

    // Folded players also contributed, so include their portion
    const foldedContribution = players
      .filter(p => p.folded && p.totalBetThisHand > prevLevel)
      .reduce((sum, p) => sum + Math.min(p.totalBetThisHand - prevLevel, increment), 0);

    const amount = contributors.length * increment + foldedContribution - (contributors.filter(p => p.folded).length * increment);
    // Simpler: sum of contributions at this level
    let potAmount = 0;
    for (const p of players) {
      const contribution = Math.min(Math.max(p.totalBetThisHand - prevLevel, 0), increment);
      potAmount += contribution;
    }

    if (potAmount > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayerIds: eligible.map(p => p.id),
      });
    }

    prevLevel = level;
  }

  return pots;
}

function cardsToString(cards: Card[]): string {
  const suitSymbols: Record<string, string> = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' };
  return cards.map(c => `${c.rank}${suitSymbols[c.suit]}`).join(' ');
}

export function startNextHand(state: GameState, config: RoomConfig): GameState {
  const activePlayers = state.players.filter(p => p.chips > 0);
  if (activePlayers.length < 2) {
    // Game over
    return { ...state, handInProgress: false };
  }

  const newState = initializeHand(state.players, config, state.dealerIndex);
  newState.handNumber = state.handNumber + 1;
  newState.gameLog = [...state.gameLog, '', `--- Hand #${newState.handNumber} ---`, ...newState.gameLog.filter(l => !l.startsWith('--- Hand'))];
  return newState;
}
