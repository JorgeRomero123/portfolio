'use client';

import { BlackjackActionType } from '@/lib/card-games/types';

interface BlackjackControlsProps {
  validActions: BlackjackActionType[];
  onAction: (type: BlackjackActionType) => void;
}

const ACTION_CONFIG: Record<BlackjackActionType, { label: string; color: string }> = {
  hit: { label: 'Hit', color: 'bg-blue-600 hover:bg-blue-700' },
  stand: { label: 'Stand', color: 'bg-emerald-600 hover:bg-emerald-700' },
  double: { label: 'Double Down', color: 'bg-amber-600 hover:bg-amber-700' },
  split: { label: 'Split', color: 'bg-purple-600 hover:bg-purple-700' },
};

export default function BlackjackControls({ validActions, onAction }: BlackjackControlsProps) {
  if (validActions.length === 0) return null;

  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {validActions.map(action => {
        const cfg = ACTION_CONFIG[action];
        return (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={`px-4 py-2 text-white rounded-lg font-semibold text-sm shadow-lg transition-colors ${cfg.color}`}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}
