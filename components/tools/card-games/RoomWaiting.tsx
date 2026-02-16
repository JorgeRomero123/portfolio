'use client';

import { useState } from 'react';

interface RoomWaitingProps {
  roomCode: string;
  members: { id: string; info: { name: string } }[];
  isHost: boolean;
  onStartGame: () => void;
  minPlayers: number;
}

export default function RoomWaiting({ roomCode, members, isHost, onStartGame, minPlayers }: RoomWaitingProps) {
  const [copied, setCopied] = useState(false);

  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/tools/card-games?room=${roomCode}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStart = members.length >= minPlayers;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Waiting Room</h2>
          <div className="bg-gray-100 rounded-lg p-4 mb-3">
            <div className="text-xs text-gray-500 mb-1">Room Code</div>
            <div className="text-3xl font-mono font-bold tracking-[0.3em] text-gray-900">{roomCode}</div>
          </div>
          <button
            onClick={copyLink}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mx-auto"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Link Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy Invite Link
              </>
            )}
          </button>
        </div>

        {/* Player list */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Players ({members.length})
          </h3>
          <div className="space-y-2">
            {members.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {m.info.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {m.info.name}
                  {i === 0 && <span className="text-xs text-emerald-600 ml-2">(Host)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {canStart ? 'Start Game' : `Need at least ${minPlayers} players`}
          </button>
        ) : (
          <div className="text-center text-sm text-gray-500">
            Waiting for the host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
