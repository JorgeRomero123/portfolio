'use client';

import { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface WheelOfFortuneProps {
  initialOptions?: string[];
}

export default function WheelOfFortune({ initialOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'] }: WheelOfFortuneProps) {
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [newOption, setNewOption] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ];

  const chartColors = [
    '#ef4444',
    '#3b82f6',
    '#22c55e',
    '#eab308',
    '#a855f7',
    '#ec4899',
    '#6366f1',
    '#f97316',
  ];

  // Initialize with proper offset on mount to show items centered
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 640;
      const itemWidth = isMobile ? 150 : 200;
      const container = document.querySelector('.overflow-hidden.bg-gray-200') as HTMLElement;
      const containerWidth = container?.offsetWidth || (isMobile ? 375 : 1152);
      const centerOffset = containerWidth / 2;

      // Start with a few items to the left of center so there's context
      const initialOffset = centerOffset + (itemWidth * 3);
      setOffset(initialOffset);
    }
  }, []);

  // Calculate statistics for pie chart
  const chartData = useMemo(() => {
    if (history.length === 0) return [];

    const counts: { [key: string]: number } = {};
    history.forEach(result => {
      counts[result] = (counts[result] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: count,
      percentage: ((count / history.length) * 100).toFixed(1),
    }));
  }, [history]);

  const addOption = () => {
    if (newOption.trim() && options.length < 12) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(options[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const newOptions = [...options];
      newOptions[editingIndex] = editingValue.trim();
      setOptions(newOptions);
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const spinWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setSelectedOption(null);

    const randomIndex = Math.floor(Math.random() * options.length);
    // Use responsive width: 150px on mobile, 200px on larger screens
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const itemWidth = isMobile ? 150 : 200;
    const extraSpins = 10;

    // The container takes full width but is constrained by max-w-6xl (1152px)
    // We need to get the actual container width
    const container = document.querySelector('.overflow-hidden.bg-gray-200') as HTMLElement;
    const containerWidth = container?.offsetWidth || (isMobile ? 375 : 1152);
    const centerOffset = containerWidth / 2;

    // To center an item: we need to move it so its center aligns with the container's center
    // Position of item's left edge: randomIndex * itemWidth
    // To center the item: centerOffset - (randomIndex * itemWidth) - (itemWidth / 2)
    // Add extra spins: subtract (options.length * itemWidth * extraSpins)
    const finalPosition = centerOffset - (randomIndex * itemWidth) - (itemWidth / 2) - (options.length * itemWidth * extraSpins);

    setOffset(finalPosition);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedOption(options[randomIndex]);
      // Add to history
      setHistory(prev => [options[randomIndex], ...prev].slice(0, 300)); // Keep last 300 results
      // Reset to the same position but without the extra spins (to keep items visible)
      const resetPosition = centerOffset - (randomIndex * itemWidth) - (itemWidth / 2);
      setOffset(resetPosition);
    }, 4000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Horizontal Spinner */}
      <div className="flex flex-col items-center w-full mb-8">
          <div className="relative w-full mb-8">
            {/* Upward arrow indicator */}
            <div className="absolute -top-6 sm:-top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-600 sm:border-l-[20px] sm:border-r-[20px] sm:border-t-[30px]" />
            </div>

            {/* Spinning container */}
            <div className="relative h-24 sm:h-32 overflow-hidden bg-gray-200 rounded-lg shadow-inner">
              <div
                className="flex items-center h-full"
                style={{
                  transform: `translateX(${offset}px)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {/* Repeat options multiple times for continuous effect */}
                {[...Array(15)].map((_, repeatIndex) => (
                  <div key={repeatIndex} className="flex">
                    {options.map((option, index) => {
                      const color = colors[index % colors.length];
                      return (
                        <div
                          key={`${repeatIndex}-${index}`}
                          className={`${color} flex items-center justify-center min-w-[150px] sm:min-w-[200px] h-24 sm:h-32 border-r-2 sm:border-r-4 border-white`}
                        >
                          <span className="text-white font-bold text-base sm:text-xl px-2 sm:px-4 text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

        <button
          onClick={spinWheel}
          disabled={isSpinning || options.length < 2}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSpinning ? 'Spinning...' : 'Spin!'}
        </button>

        {selectedOption && (
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-green-100 border-2 border-green-500 rounded-lg w-full max-w-md">
            <p className="text-center text-base sm:text-lg font-semibold text-gray-900">
              Selected: <span className="text-green-700">{selectedOption}</span>
            </p>
          </div>
        )}
      </div>

      {/* Options Manager */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-8 max-w-2xl mx-auto">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Manage Options</h3>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addOption()}
              placeholder="Add new option..."
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              maxLength={30}
            />
            <button
              onClick={addOption}
              disabled={!newOption.trim() || options.length >= 12}
              className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            >
              Add
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {options.length}/12 options (min: 2)
          </p>
        </div>

        <div className="space-y-2">
          {options.map((option, index) => {
            const color = colors[index % colors.length];
            const isEditing = editingIndex === index;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className={`w-3 sm:w-4 h-3 sm:h-4 rounded-full ${color} flex-shrink-0`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      onBlur={saveEdit}
                      autoFocus
                      maxLength={30}
                      className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  ) : (
                    <span
                      className="text-sm sm:text-base text-gray-900 truncate cursor-pointer hover:text-blue-600"
                      onClick={() => startEditing(index)}
                      title="Click to edit"
                    >
                      {option}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 ml-2 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="text-xs sm:text-sm text-green-600 hover:text-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs sm:text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(index)}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 2}
                        className="text-xs sm:text-sm text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* History & Statistics */}
      {history.length > 0 && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Statistics ({history.length} spins)
            </h3>
            <button
              onClick={() => setHistory([])}
              className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Pie Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => `${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => {
                      const optionIndex = options.indexOf(entry.name);
                      const color = optionIndex >= 0 ? chartColors[optionIndex % chartColors.length] : '#6b7280';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => `${value || 0} spins`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Recent History List */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">Recent Spins</h4>
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {history.slice(0, 20).map((result, index) => {
                    const optionIndex = options.indexOf(result);
                    const color = optionIndex >= 0 ? colors[optionIndex % colors.length] : 'bg-gray-500';
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-2 sm:gap-3 p-2 bg-gray-50 rounded"
                      >
                        <span className="text-xs sm:text-sm text-gray-500 font-mono w-5 sm:w-6 flex-shrink-0">#{index + 1}</span>
                        <div className={`w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full ${color} flex-shrink-0`} />
                        <span className="text-sm sm:text-base text-gray-900 flex-1 truncate">{result}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {history.length > 20 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Showing 20 of {history.length} total spins
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
