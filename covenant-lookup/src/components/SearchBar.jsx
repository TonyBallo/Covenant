import { useState } from 'react';

export function SearchBar({ onSearch, loading }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handleClear = () => {
    setInput('');
  };

  // Sample addresses for quick testing
  const sampleAddresses = [
    { label: 'Try Bronze', value: '0x1111111111111111111111111111111111111111' },
    { label: 'Try Gold', value: '0x5555555555555555555555555555555555555555' },
    { label: 'Try Diamond', value: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Ethereum address (0x...)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-covenant-purple focus:border-transparent text-sm font-mono"
            disabled={loading}
          />
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition"
              disabled={loading}
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-covenant-purple hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      {/* Quick sample buttons - remove for production */}
      <div className="mt-4 flex gap-2 justify-center">
        <p className="text-sm text-gray-600 mr-2">Quick test:</p>
        {sampleAddresses.map((sample) => (
          <button
            key={sample.value}
            onClick={() => setInput(sample.value)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded transition"
            disabled={loading}
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}