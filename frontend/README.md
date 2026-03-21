# Covenant Lookup Tool

Web-based lookup interface for Covenant Protocol verification seals.

## Overview

This is a React-based frontend application that allows anyone to query Ethereum addresses and view their Covenant verification status directly from the blockchain.

**Live on Sepolia testnet.**

---

## Features

- 🔍 **Address Search** - Query any Ethereum address
- 🎨 **Tier Visualization** - Color-coded tier badges (Bronze → Diamond)
- ✅ **Real-time Data** - Reads directly from blockchain
- 🔗 **Etherscan Integration** - Verify data independently
- 📱 **Responsive Design** - Works on desktop and mobile

---

## Tech Stack

- **Framework:** React 18 + Vite
- **Web3:** ethers.js v6
- **Styling:** Tailwind CSS
- **Network:** Ethereum Sepolia Testnet
- **RPC:** Alchemy

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173

### Environment Setup

Update `src/utils/contract.js` with your configuration:
```javascript
// Contract address (Sepolia)
export const CONTRACT_ADDRESS = '0x60859A972A9996cf24448323c7b1E49825f092a4';

// RPC endpoint (replace with your Alchemy key)
export const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY';
```

---

## Project Structure
```
covenant-lookup/
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx       # Address search interface
│   │   └── ResultDisplay.jsx   # Seal data display
│   ├── utils/
│   │   ├── contract.js         # Contract config & ABI
│   │   └── constants.js        # Tier definitions
│   ├── App.jsx                 # Main application
│   └── main.jsx                # Entry point
├── public/
├── package.json
└── vite.config.js
```

---

## Test Data

Try these addresses on Sepolia:

**Tier 1 (Bronze):**
```
0x1111111111111111111111111111111111111111
```

**Tier 3 (Gold):**
```
0x5555555555555555555555555555555555555555
```

**Tier 5 (Diamond):**
```
0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

**No Verification:**
```
0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef
```

---

## How It Works

1. **User enters Ethereum address** in search bar
2. **Frontend creates read-only provider** using Alchemy RPC
3. **Calls `getVerificationStatus(address)`** on IdentityPact contract
4. **Displays seal data** - tier, mint date, revocation status, burn status
5. **All data verified on-chain** - no backend, no API

---

## Tier System

| Tier | Name | Color | Description |
|------|------|-------|-------------|
| I | Bronze | Orange | Basic email verification |
| II | Silver | Gray | Phone + email verification |
| III | Gold | Yellow | Government ID verification |
| IV | Platinum | Blue | Enhanced KYC verification |
| V | Diamond | Purple | Institutional-grade verification |

---

## Contract Integration

The frontend reads from the IdentityPact v2 contract:

**Contract Address (Sepolia):**
```
0x60859A972A9996cf24448323c7b1E49825f092a4
```

**View on Etherscan:**
https://sepolia.etherscan.io/address/0x60859A972A9996cf24448323c7b1E49825f092a4

**Key Functions Used:**
- `getVerificationStatus(address)` - Returns tier, revocation, burn status
- `addressToSealId(address)` - Returns seal ID for address
- `sealData(sealId)` - Returns detailed seal information

---

## Building for Production
```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

Output in `dist/` folder ready for deployment.

---

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### GitHub Pages

Update `vite.config.js`:
```javascript
export default {
  base: '/covenant-lookup/'
}
```

Then:
```bash
npm run build
# Push dist folder to gh-pages branch
```

---

## Development

### Adding New Features

1. **Components** go in `src/components/`
2. **Utilities** go in `src/utils/`
3. **Styling** uses Tailwind utility classes

### Contract Updates

If contract is redeployed:
1. Update `CONTRACT_ADDRESS` in `src/utils/contract.js`
2. Update `CONTRACT_ABI` if functions changed
3. Restart dev server

---

## Troubleshooting

**"Failed to fetch verification status"**
- Check Alchemy RPC URL is correct
- Verify contract address is correct
- Check network (must be Sepolia)

**Slow loading**
- Public RPC may be slow
- Use Alchemy or Infura instead
- Check browser console for errors

**Address not found**
- Address may not have a seal
- Verify address is checksummed correctly
- Try on Etherscan to confirm

---

## License

MIT

---

## Links

- **Main Project:** ../README.md
- **Smart Contract:** ../contracts/IdentityPact.sol
- **Contract on Etherscan:** https://sepolia.etherscan.io/address/0x60859A972A9996cf24448323c7b1E49825f092a4
```

---

## **Step 3: Update .gitignore**

**Make sure your Alchemy key isn't committed!**

**Edit `~/Desktop/Project_Covenant/.gitignore`:**

Add these lines if not already there:
```
# Environment variables
.env
.env.local

# Frontend
covenant-lookup/node_modules/
covenant-lookup/dist/
covenant-lookup/.env