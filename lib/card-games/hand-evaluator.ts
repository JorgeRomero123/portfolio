import { Card, HandEvaluation, HandRankValue } from './types';
import { rankValue } from './cards';

function combinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];
  const [first, ...rest] = cards;
  const withFirst = combinations(rest, k - 1).map(c => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function isFlush(hand: Card[]): boolean {
  return hand.every(c => c.suit === hand[0].suit);
}

function isStraight(values: number[]): boolean {
  const sorted = [...values].sort((a, b) => b - a);
  // Check normal straight
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] - sorted[i + 1] !== 1) {
      // Check ace-low straight (A-2-3-4-5)
      if (sorted[0] === 14 && sorted[1] === 5 && sorted[2] === 4 && sorted[3] === 3 && sorted[4] === 2) {
        return true;
      }
      return false;
    }
  }
  return true;
}

function getStraightHighCard(values: number[]): number {
  const sorted = [...values].sort((a, b) => b - a);
  // Ace-low straight
  if (sorted[0] === 14 && sorted[1] === 5) return 5;
  return sorted[0];
}

function evaluateFiveCards(hand: Card[]): HandEvaluation {
  const values = hand.map(c => rankValue(c.rank)).sort((a, b) => b - a);
  const flush = isFlush(hand);
  const straight = isStraight(values);

  // Count rank frequencies
  const counts: Record<number, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const groups = Object.entries(counts)
    .map(([val, count]) => ({ val: Number(val), count }))
    .sort((a, b) => b.count - a.count || b.val - a.val);

  // Royal Flush
  if (flush && straight && values.includes(14) && values.includes(13)) {
    return {
      rankValue: 10,
      rankName: 'Royal Flush',
      kickers: [14],
      bestCards: hand,
      description: `Royal Flush`,
    };
  }

  // Straight Flush
  if (flush && straight) {
    const high = getStraightHighCard(values);
    return {
      rankValue: 9,
      rankName: 'Straight Flush',
      kickers: [high],
      bestCards: hand,
      description: `Straight Flush, ${rankLabel(high)} high`,
    };
  }

  // Four of a Kind
  if (groups[0].count === 4) {
    return {
      rankValue: 8,
      rankName: 'Four of a Kind',
      kickers: [groups[0].val, groups[1].val],
      bestCards: hand,
      description: `Four of a Kind, ${rankLabel(groups[0].val)}s`,
    };
  }

  // Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      rankValue: 7,
      rankName: 'Full House',
      kickers: [groups[0].val, groups[1].val],
      bestCards: hand,
      description: `Full House, ${rankLabel(groups[0].val)}s full of ${rankLabel(groups[1].val)}s`,
    };
  }

  // Flush
  if (flush) {
    return {
      rankValue: 6,
      rankName: 'Flush',
      kickers: values,
      bestCards: hand,
      description: `Flush, ${rankLabel(values[0])} high`,
    };
  }

  // Straight
  if (straight) {
    const high = getStraightHighCard(values);
    return {
      rankValue: 5,
      rankName: 'Straight',
      kickers: [high],
      bestCards: hand,
      description: `Straight, ${rankLabel(high)} high`,
    };
  }

  // Three of a Kind
  if (groups[0].count === 3) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.val);
    return {
      rankValue: 4,
      rankName: 'Three of a Kind',
      kickers: [groups[0].val, ...kickers],
      bestCards: hand,
      description: `Three of a Kind, ${rankLabel(groups[0].val)}s`,
    };
  }

  // Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = [groups[0].val, groups[1].val].sort((a, b) => b - a);
    const kicker = groups[2].val;
    return {
      rankValue: 3,
      rankName: 'Two Pair',
      kickers: [...pairs, kicker],
      bestCards: hand,
      description: `Two Pair, ${rankLabel(pairs[0])}s and ${rankLabel(pairs[1])}s`,
    };
  }

  // One Pair
  if (groups[0].count === 2) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.val);
    return {
      rankValue: 2,
      rankName: 'Pair',
      kickers: [groups[0].val, ...kickers],
      bestCards: hand,
      description: `Pair of ${rankLabel(groups[0].val)}s`,
    };
  }

  // High Card
  return {
    rankValue: 1,
    rankName: 'High Card',
    kickers: values,
    bestCards: hand,
    description: `${rankLabel(values[0])} High`,
  };
}

function rankLabel(value: number): string {
  const labels: Record<number, string> = {
    14: 'Ace', 13: 'King', 12: 'Queen', 11: 'Jack', 10: 'Ten',
    9: 'Nine', 8: 'Eight', 7: 'Seven', 6: 'Six', 5: 'Five',
    4: 'Four', 3: 'Three', 2: 'Two',
  };
  return labels[value] || String(value);
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];
  const fiveCardCombos = combinations(allCards, 5);

  let best: HandEvaluation | null = null;
  for (const combo of fiveCardCombos) {
    const evaluation = evaluateFiveCards(combo);
    if (!best || compareHands(evaluation, best) > 0) {
      best = evaluation;
    }
  }

  return best!;
}

export function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  if (a.rankValue !== b.rankValue) return a.rankValue - b.rankValue;
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const aK = a.kickers[i] ?? 0;
    const bK = b.kickers[i] ?? 0;
    if (aK !== bK) return aK - bK;
  }
  return 0;
}
