// Tiny, dependency-free facts about the landmark flow that GameShell needs statically
// (the flow itself is loaded with next/dynamic).
export type FlowStep = 'prompt' | 'game' | 'lost' | 'stamp' | 'wheel' | 'final' | 'card';

/** Steps that cover the stage completely: the 3D board pauses rendering while they're open. */
export const PAUSING_STEPS: readonly FlowStep[] = ['game', 'lost', 'stamp', 'wheel', 'final'];
