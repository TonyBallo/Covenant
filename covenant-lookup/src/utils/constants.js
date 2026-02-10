// Tier definitions with colors matching the Imperial theme
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

// Format timestamp to readable date
export function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format address for display
export function formatAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}