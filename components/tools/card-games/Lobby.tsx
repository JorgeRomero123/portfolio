'use client';

import { useState } from 'react';
import { DEFAULT_CONFIG, ROOM_CODE_LENGTH } from '@/lib/card-games/constants';
import { RoomConfig, GameType } from '@/lib/card-games/types';

interface LobbyProps {
  initialRoomCode?: string;
  onCreateRoom: (playerName: string, config: RoomConfig) => void;
  onJoinRoom: (playerName: string, roomCode: string) => void;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function Lobby({ initialRoomCode, onCreateRoom, onJoinRoom }: LobbyProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(initialRoomCode ? 'join' : 'choose');
  const [config, setConfig] = useState<RoomConfig>({ ...DEFAULT_CONFIG });

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreateRoom(name.trim(), config);
  };

  const handleJoin = () => {
    if (!name.trim() || !roomCode.trim()) return;
    onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
  };

  if (mode === 'choose') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">♠️</div>
            <h2 className="text-2xl font-bold text-gray-900">Card Games</h2>
            <p className="text-gray-500 mt-1">Play cards with friends in real-time</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setMode('create')}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <button
          onClick={() => setMode('choose')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {mode === 'create' ? 'Create a Room' : 'Join a Room'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              maxLength={20}
            />
          </div>

          {mode === 'join' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={ROOM_CODE_LENGTH}
              />
            </div>
          )}

          {mode === 'create' && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Game Settings</h3>

              {/* Game type toggle */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Game Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['poker', "Texas Hold'em"], ['blackjack', 'Blackjack 21']] as [GameType, string][]).map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setConfig({ ...config, gameType: type })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        config.gameType === type
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Starting Chips</label>
                  <select
                    value={config.startingChips}
                    onChange={e => setConfig({ ...config, startingChips: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  >
                    <option value={500}>500</option>
                    <option value={1000}>1,000</option>
                    <option value={2000}>2,000</option>
                    <option value={5000}>5,000</option>
                  </select>
                </div>

                {config.gameType === 'poker' ? (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Blinds</label>
                    <select
                      value={config.smallBlind}
                      onChange={e => {
                        const sb = Number(e.target.value);
                        setConfig({ ...config, smallBlind: sb, bigBlind: sb * 2 });
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value={5}>5 / 10</option>
                      <option value={10}>10 / 20</option>
                      <option value={25}>25 / 50</option>
                      <option value={50}>50 / 100</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bet per Hand</label>
                    <select
                      value={config.betAmount}
                      onChange={e => setConfig({ ...config, betAmount: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={mode === 'create' ? handleCreate : handleJoin}
            disabled={!name.trim() || (mode === 'join' && roomCode.length < ROOM_CODE_LENGTH)}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { generateRoomCode };
