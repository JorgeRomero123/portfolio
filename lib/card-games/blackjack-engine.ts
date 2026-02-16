import { Card, BlackjackGameState, BlackjackPlayer, BlackjackHand, BlackjackAction, BlackjackActionType } from './types';
import { createDeck, shuffle, deal } from './cards';

export function cardPointValue(card: Card): number {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank, 10);
}

export function handTotal(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    const val = cardPointValue(card);
    total += val;
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

function cardsToString(cards: Card[]): string {
  const suitSymbols: Record<string, string> = { hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660' };
  return cards.map(c => `${c.rank}${suitSymbols[c.suit]}`).join(' ');
}

function sameValue(a: Card, b: Card): boolean {
  return cardPointValue(a) === cardPointValue(b);
}

export function initializeBlackjackHand(
  players: BlackjackPlayer[],
  betAmount: number,
  prevHandNumber: number
): BlackjackGameState {
  let deck = shuffle(createDeck());
  const gameLog: string[] = [`--- Hand #${prevHandNumber + 1} ---`];

  // Reset players and deduct bets
  for (const p of players) {
    const bet = Math.min(betAmount, p.chips);
    p.chips -= bet;
    p.hands = [{
      cards: [],
      bet,
      stood: false,
      busted: false,
      isBlackjack: false,
      result: null,
      payout: 0,
    }];
    p.activeHandIndex = 0;
  }

  // Deal 2 cards to each player
  for (const p of players) {
    const { cards, remaining } = deal(deck, 2);
    p.hands[0].cards = cards;
    deck = remaining;
    gameLog.push(`${p.name} is dealt ${cardsToString(cards)}`);
  }

  // Deal 2 cards to dealer
  const { cards: dealerCards, remaining: afterDealer } = deal(deck, 2);
  deck = afterDealer;
  gameLog.push(`Dealer shows ${cardsToString([dealerCards[0]])}`);

  const dealerBJ = handTotal(dealerCards).total === 21;

  // Check for dealer blackjack
  if (dealerBJ) {
    gameLog.push(`Dealer has Blackjack! ${cardsToString(dealerCards)}`);
    // Resolve all hands immediately
    const winners: BlackjackGameState['winners'] = [];
    for (const p of players) {
      const hand = p.hands[0];
      const playerBJ = handTotal(hand.cards).total === 21;
      if (playerBJ) {
        hand.result = 'push';
        hand.payout = hand.bet;
        p.chips += hand.bet;
        gameLog.push(`${p.name} also has Blackjack - Push`);
      } else {
        hand.result = 'lose';
        hand.payout = 0;
        gameLog.push(`${p.name} loses ${hand.bet}`);
        winners.push({
          playerId: 'dealer',
          playerName: 'Dealer',
          amount: hand.bet,
          hand: { description: 'Blackjack' },
        });
      }
    }

    return {
      phase: 'resolved',
      deck,
      dealerCards,
      dealerRevealed: true,
      players,
      activePlayerIndex: 0,
      handNumber: prevHandNumber + 1,
      gameLog,
      winners: winners.length > 0 ? winners : [{ playerId: 'dealer', playerName: 'Dealer', amount: 0, hand: { description: 'Blackjack - Push' } }],
      handInProgress: false,
      betAmount,
    };
  }

  // Check for player blackjacks
  let allDone = true;
  for (const p of players) {
    const hand = p.hands[0];
    if (handTotal(hand.cards).total === 21) {
      hand.isBlackjack = true;
      hand.stood = true;
      gameLog.push(`${p.name} has Blackjack!`);
    } else {
      allDone = false;
    }
  }

  // Find first player who can act
  let activePlayerIndex = 0;
  if (!allDone) {
    activePlayerIndex = players.findIndex(p => !p.hands[0].stood && !p.hands[0].busted);
    if (activePlayerIndex === -1) activePlayerIndex = 0;
  }

  const state: BlackjackGameState = {
    phase: allDone ? 'dealer' : 'playing',
    deck,
    dealerCards,
    dealerRevealed: false,
    players,
    activePlayerIndex,
    handNumber: prevHandNumber + 1,
    gameLog,
    winners: null,
    handInProgress: true,
    betAmount,
  };

  // If all players have blackjack, go straight to dealer
  if (allDone) {
    return playDealerAndResolve(state);
  }

  return state;
}

export function getValidBlackjackActions(state: BlackjackGameState): BlackjackActionType[] {
  if (state.phase !== 'playing') return [];

  const player = state.players[state.activePlayerIndex];
  if (!player) return [];

  const hand = player.hands[player.activeHandIndex];
  if (!hand || hand.stood || hand.busted) return [];

  const actions: BlackjackActionType[] = ['hit', 'stand'];

  // Double: only on first 2 cards and enough chips
  if (hand.cards.length === 2 && player.chips >= hand.bet) {
    actions.push('double');
  }

  // Split: only on first 2 cards, same value, max 1 split (2 hands), and enough chips
  if (
    hand.cards.length === 2 &&
    player.hands.length === 1 &&
    sameValue(hand.cards[0], hand.cards[1]) &&
    player.chips >= hand.bet
  ) {
    actions.push('split');
  }

  return actions;
}

export function processBlackjackAction(state: BlackjackGameState, action: BlackjackAction): BlackjackGameState {
  const newState: BlackjackGameState = {
    ...state,
    players: state.players.map(p => ({
      ...p,
      hands: p.hands.map(h => ({ ...h, cards: [...h.cards] })),
    })),
    deck: [...state.deck],
    dealerCards: [...state.dealerCards],
    gameLog: [...state.gameLog],
  };

  const playerIdx = newState.players.findIndex(p => p.id === action.playerId);
  if (playerIdx === -1 || playerIdx !== newState.activePlayerIndex) return newState;

  const player = newState.players[playerIdx];
  const hand = player.hands[player.activeHandIndex];

  switch (action.type) {
    case 'hit': {
      const { cards, remaining } = deal(newState.deck, 1);
      hand.cards.push(cards[0]);
      newState.deck = remaining;
      const { total } = handTotal(hand.cards);
      newState.gameLog.push(`${player.name} hits - ${cardsToString(cards)} (${total})`);
      if (total > 21) {
        hand.busted = true;
        hand.result = 'lose';
        hand.payout = 0;
        newState.gameLog.push(`${player.name} busts!`);
      } else if (total === 21) {
        hand.stood = true;
      }
      break;
    }
    case 'stand': {
      hand.stood = true;
      newState.gameLog.push(`${player.name} stands (${handTotal(hand.cards).total})`);
      break;
    }
    case 'double': {
      const additionalBet = Math.min(hand.bet, player.chips);
      player.chips -= additionalBet;
      hand.bet += additionalBet;
      const { cards, remaining } = deal(newState.deck, 1);
      hand.cards.push(cards[0]);
      newState.deck = remaining;
      const { total } = handTotal(hand.cards);
      newState.gameLog.push(`${player.name} doubles down - ${cardsToString(cards)} (${total})`);
      if (total > 21) {
        hand.busted = true;
        hand.result = 'lose';
        hand.payout = 0;
        newState.gameLog.push(`${player.name} busts!`);
      } else {
        hand.stood = true;
      }
      break;
    }
    case 'split': {
      const splitCard = hand.cards.pop()!;
      const additionalBet = hand.bet;
      player.chips -= additionalBet;

      // Deal one card to each hand
      const { cards: card1, remaining: r1 } = deal(newState.deck, 1);
      hand.cards.push(card1[0]);
      const { cards: card2, remaining: r2 } = deal(r1, 1);
      newState.deck = r2;

      const newHand: BlackjackHand = {
        cards: [splitCard, card2[0]],
        bet: additionalBet,
        stood: false,
        busted: false,
        isBlackjack: false,
        result: null,
        payout: 0,
      };
      player.hands.push(newHand);

      newState.gameLog.push(`${player.name} splits`);

      // If split aces, auto-stand both hands
      if (hand.cards[0].rank === 'A') {
        hand.stood = true;
        newHand.stood = true;
        newState.gameLog.push(`Split aces - one card each, auto-stand`);
      } else {
        // Check if first hand is 21
        if (handTotal(hand.cards).total === 21) {
          hand.stood = true;
        }
      }
      break;
    }
  }

  return advanceBlackjack(newState);
}

function advanceBlackjack(state: BlackjackGameState): BlackjackGameState {
  const player = state.players[state.activePlayerIndex];

  // Try to advance to next hand of current player
  const currentHand = player.hands[player.activeHandIndex];
  if (currentHand.stood || currentHand.busted) {
    // Move to next hand if split
    if (player.activeHandIndex < player.hands.length - 1) {
      player.activeHandIndex++;
      const nextHand = player.hands[player.activeHandIndex];
      if (nextHand.stood || nextHand.busted) {
        // This hand is also done, advance to next player
        return advanceToNextPlayer(state);
      }
      return state;
    }
    // Move to next player
    return advanceToNextPlayer(state);
  }

  return state;
}

function advanceToNextPlayer(state: BlackjackGameState): BlackjackGameState {
  // Find next player who has an active hand
  for (let i = state.activePlayerIndex + 1; i < state.players.length; i++) {
    const p = state.players[i];
    const hasActiveHand = p.hands.some(h => !h.stood && !h.busted);
    if (hasActiveHand) {
      state.activePlayerIndex = i;
      p.activeHandIndex = p.hands.findIndex(h => !h.stood && !h.busted);
      return state;
    }
  }

  // All players done — dealer's turn
  return playDealerAndResolve(state);
}

export function playDealerAndResolve(state: BlackjackGameState): BlackjackGameState {
  const newState: BlackjackGameState = {
    ...state,
    deck: [...state.deck],
    dealerCards: [...state.dealerCards],
    gameLog: [...state.gameLog],
    players: state.players.map(p => ({
      ...p,
      hands: p.hands.map(h => ({ ...h, cards: [...h.cards] })),
    })),
  };

  newState.dealerRevealed = true;
  newState.phase = 'dealer';

  // Check if all player hands busted — dealer doesn't need to play
  const allBusted = newState.players.every(p => p.hands.every(h => h.busted));

  if (!allBusted) {
    // Dealer hits on < 17, stands on >= 17
    newState.gameLog.push(`Dealer reveals: ${cardsToString(newState.dealerCards)} (${handTotal(newState.dealerCards).total})`);
    while (handTotal(newState.dealerCards).total < 17) {
      const { cards, remaining } = deal(newState.deck, 1);
      newState.dealerCards.push(cards[0]);
      newState.deck = remaining;
      newState.gameLog.push(`Dealer hits - ${cardsToString(cards)} (${handTotal(newState.dealerCards).total})`);
    }
    const dealerTotal = handTotal(newState.dealerCards).total;
    if (dealerTotal > 21) {
      newState.gameLog.push(`Dealer busts with ${dealerTotal}!`);
    } else {
      newState.gameLog.push(`Dealer stands at ${dealerTotal}`);
    }
  } else {
    newState.gameLog.push(`All players busted - dealer wins`);
  }

  // Resolve each hand
  const dealerTotal = handTotal(newState.dealerCards).total;
  const dealerBusted = dealerTotal > 21;
  const winners: BlackjackGameState['winners'] = [];

  for (const p of newState.players) {
    for (const hand of p.hands) {
      if (hand.busted) {
        hand.result = 'lose';
        hand.payout = 0;
        continue;
      }

      const playerTotal = handTotal(hand.cards).total;

      if (hand.isBlackjack) {
        // Blackjack pays 3:2
        const payout = hand.bet + Math.floor(hand.bet * 1.5);
        hand.result = 'blackjack';
        hand.payout = payout;
        p.chips += payout;
        newState.gameLog.push(`${p.name} wins ${payout} with Blackjack!`);
        winners.push({
          playerId: p.id,
          playerName: p.name,
          amount: payout,
          hand: { description: `Blackjack (21)` },
        });
      } else if (dealerBusted) {
        const payout = hand.bet * 2;
        hand.result = 'win';
        hand.payout = payout;
        p.chips += payout;
        newState.gameLog.push(`${p.name} wins ${payout} (dealer busted)`);
        winners.push({
          playerId: p.id,
          playerName: p.name,
          amount: payout,
          hand: { description: `${playerTotal} vs dealer bust` },
        });
      } else if (playerTotal > dealerTotal) {
        const payout = hand.bet * 2;
        hand.result = 'win';
        hand.payout = payout;
        p.chips += payout;
        newState.gameLog.push(`${p.name} wins ${payout} (${playerTotal} vs ${dealerTotal})`);
        winners.push({
          playerId: p.id,
          playerName: p.name,
          amount: payout,
          hand: { description: `${playerTotal} beats dealer's ${dealerTotal}` },
        });
      } else if (playerTotal === dealerTotal) {
        hand.result = 'push';
        hand.payout = hand.bet;
        p.chips += hand.bet;
        newState.gameLog.push(`${p.name} pushes (${playerTotal} vs ${dealerTotal})`);
      } else {
        hand.result = 'lose';
        hand.payout = 0;
        newState.gameLog.push(`${p.name} loses (${playerTotal} vs ${dealerTotal})`);
      }
    }
  }

  newState.phase = 'resolved';
  newState.handInProgress = false;
  newState.winners = winners.length > 0 ? winners : [{
    playerId: 'dealer',
    playerName: 'Dealer',
    amount: 0,
    hand: { description: `Dealer wins with ${dealerTotal}` },
  }];

  return newState;
}

export function startNextBlackjackHand(state: BlackjackGameState, betAmount: number): BlackjackGameState {
  const activePlayers = state.players.filter(p => p.chips >= betAmount);
  if (activePlayers.length === 0) {
    return { ...state, handInProgress: false };
  }

  // Reset players
  const players: BlackjackPlayer[] = state.players.map(p => ({
    ...p,
    hands: [],
    activeHandIndex: 0,
  }));

  // Filter out players who can't afford the bet
  const eligible = players.filter(p => p.chips >= betAmount);
  if (eligible.length === 0) {
    return { ...state, handInProgress: false };
  }

  const newState = initializeBlackjackHand(eligible, betAmount, state.handNumber);
  newState.gameLog = [...state.gameLog, '', ...newState.gameLog];
  return newState;
}
