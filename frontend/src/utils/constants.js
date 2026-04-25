// Tier definitions keyed by tier number (0–5).
// color strings are used as keys in dynamic Tailwind class maps in ResultDisplay and StatusPage.
export const TIERS = {
  0: { 
    name: 'None', 
    color: 'gray', 
    numeral: '—',
    description: 'No verification'
  },
  1: { 
    name: 'Bronze', 
    color: 'orange', 
    numeral: 'I',
    description: 'Basic email verification'
  },
  2: { 
    name: 'Silver', 
    color: 'gray', 
    numeral: 'II',
    description: 'Phone + email verification'
  },
  3: { 
    name: 'Gold', 
    color: 'yellow', 
    numeral: 'III',
    description: 'Government ID verification'
  },
  4: { 
    name: 'Platinum', 
    color: 'blue', 
    numeral: 'IV',
    description: 'Enhanced KYC verification'
  },
  5: { 
    name: 'Diamond', 
    color: 'purple', 
    numeral: 'V',
    description: 'Institutional-grade verification'
  },
};

// Format a Unix timestamp (seconds) to a human-readable date string.
// Multiplies by 1000 because JS Date expects milliseconds.
export function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format a burn countdown from a Unix timestamp (seconds).
// Returns a human-readable string showing days+hours or hours+minutes as appropriate.
export function formatBurnCountdown(burnExecutableAt) {
  const secondsLeft = burnExecutableAt - Math.floor(Date.now() / 1000);
  if (secondsLeft <= 0) return 'Ready to execute';
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

// Format address for display
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ISO 3166-1 numeric jurisdiction codes. 0 = global (no restriction).
// Keyed by numeric code; value is display label.
export const JURISDICTIONS = {
  0:   { label: 'Global',         flag: '🌐' },
  36:  { label: 'Australia',      flag: '🇦🇺' },
  76:  { label: 'Brazil',         flag: '🇧🇷' },
  124: { label: 'Canada',         flag: '🇨🇦' },
  156: { label: 'China',          flag: '🇨🇳' },
  250: { label: 'France',         flag: '🇫🇷' },
  276: { label: 'Germany',        flag: '🇩🇪' },
  356: { label: 'India',          flag: '🇮🇳' },
  380: { label: 'Italy',          flag: '🇮🇹' },
  392: { label: 'Japan',          flag: '🇯🇵' },
  484: { label: 'Mexico',         flag: '🇲🇽' },
  528: { label: 'Netherlands',    flag: '🇳🇱' },
  620: { label: 'Portugal',       flag: '🇵🇹' },
  702: { label: 'Singapore',      flag: '🇸🇬' },
  724: { label: 'Spain',          flag: '🇪🇸' },
  756: { label: 'Switzerland',    flag: '🇨🇭' },
  826: { label: 'United Kingdom', flag: '🇬🇧' },
  840: { label: 'United States',  flag: '🇺🇸' },
};

// Returns a display string for a numeric jurisdiction code.
// Unknown codes fall back to the raw number.
export function formatJurisdiction(code) {
  const n = Number(code);
  return JURISDICTIONS[n] ?? { label: `Code ${n}`, flag: '🏳' };
}