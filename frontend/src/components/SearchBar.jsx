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

  const sampleAddresses = [
    { label: 'Try Bronze',   value: '0x1111111111111111111111111111111111111111' },
    { label: 'Try Silver',   value: '0x3333333333333333333333333333333333333333' },
    { label: 'Try Gold',     value: '0x5555555555555555555555555555555555555555' },
    { label: 'Try Platinum', value: '0x8888888888888888888888888888888888888888' },
    { label: 'Try Diamond',  value: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-0 border border-gold/30 focus-within:border-gold/70 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter wallet address  0x…"
            className="flex-1 px-5 py-4 bg-tyrian-dark text-marble font-mono text-sm placeholder-marble-muted focus:outline-none"
            disabled={loading}
          />
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 text-marble-muted hover:text-gold transition-colors bg-tyrian-dark"
              disabled={loading}
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="font-cinzel text-xs tracking-widest uppercase px-8 py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border border-tyrian-deep border-t-transparent rounded-full animate-spin"></div>
                Searching
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-3 justify-center items-center">
        <span className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">Quick test</span>
        {sampleAddresses.map((sample) => (
          <button
            key={sample.value}
            onClick={() => setInput(sample.value)}
            className="font-cinzel text-xs tracking-wide text-marble-muted border border-gold/20 px-3 py-1 hover:border-gold/50 hover:text-gold transition-colors disabled:opacity-40"
            disabled={loading}
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
}
