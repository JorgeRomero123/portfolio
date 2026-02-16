import { GameState, FilteredGameState, FilteredPlayer } from './types';
import { getValidActions } from './poker-engine';

export function filterStateForPlayer(state: GameState, playerId: string): FilteredGameState {
  const isShowdown = state.round === 'showdown' || !state.handInProgress;
  const playerIdx = state.players.findIndex(p => p.id === playerId);

  const filteredPlayers: FilteredPlayer[] = state.players.map(p => ({
    id: p.id,
    name: p.name,
    chips: p.chips,
    holeCards: p.id === playerId
      ? p.holeCards
      : (isShowdown && !p.folded ? p.holeCards : null),
    cardCount: p.holeCards.length,
    totalBetThisRound: p.totalBetThisRound,
    totalBetThisHand: p.totalBetThisHand,
    folded: p.folded,
    allIn: p.allIn,
    sittingOut: p.sittingOut,
    connected: p.connected,
  }));

  const isMyTurn = state.activePlayerIndex === playerIdx && state.handInProgress;
  const { actions, callAmount, minRaiseTotal, maxRaiseTotal } = isMyTurn
    ? getValidActions(state)
    : { actions: [], callAmount: 0, minRaiseTotal: 0, maxRaiseTotal: 0 };

  return {
    round: state.round,
    communityCards: state.communityCards,
    pot: state.pot,
    sidePots: state.sidePots,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    dealerIndex: state.dealerIndex,
    activePlayerIndex: state.activePlayerIndex,
    players: filteredPlayers,
    handNumber: state.handNumber,
    gameLog: state.gameLog,
    winners: state.winners,
    handInProgress: state.handInProgress,
    validActions: isMyTurn ? actions : [],
    callAmount,
    minRaiseTotal,
    maxRaiseTotal,
  };
}

export function filterStateForAllPlayers(state: GameState): Record<string, FilteredGameState> {
  const result: Record<string, FilteredGameState> = {};
  for (const player of state.players) {
    result[player.id] = filterStateForPlayer(state, player.id);
  }
  return result;
}
