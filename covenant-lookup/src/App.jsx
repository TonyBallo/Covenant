import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState } from 'react';
import { ethers } from 'ethers';
import { SearchBar } from './components/SearchBar';
import { ResultDisplay } from './components/ResultDisplay';
import { TierSelect } from './pages/TierSelect';
import { ApplyForm } from './pages/ApplyForm';
import { StatusPage } from './pages/StatusPage';
import { VerifySuccess } from './pages/VerifySuccess';
import { VerifyFailed } from './pages/VerifyFailed';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE } from './utils/contract';
import { Admin } from './pages/Admin';
import { VendorDemo } from './pages/VendorDemo';

// ============ Shared Navbar ============

function Navbar({ walletAddress, walletConnected, onConnect, onDisconnect }) {
  return (
    <header className="bg-tyrian-darker/95 border-b border-gold/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          <Link to="/" className="flex items-center gap-4">
            <div className="w-9 h-9 border border-gold/50 flex items-center justify-center">
              <span className="font-cinzel text-gold font-semibold text-lg leading-none">C</span>
            </div>
            <div>
              <h1 className="font-cinzel text-marble tracking-[0.2em] uppercase text-base leading-tight">
                Covenant
              </h1>
              <p className="font-cormorant text-marble-muted italic text-xs tracking-wider leading-tight">
                Web3 Identity Verification
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/admin"
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Admin
            </Link>
            {walletConnected && (
              <Link
                to="/status"
                className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
              >
                My Status
              </Link>
            )}
            <Link
              to="/vendor-demo"
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Vendor Demo
            </Link>
            <Link
              to="/get-verified"
              className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/60 text-gold hover:bg-gold/10 transition-colors"
            >
              Get Verified
            </Link>
            {!walletConnected ? (
              <button
                onClick={onConnect}
                className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/30 text-marble-muted hover:border-gold/60 hover:text-gold transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 px-3 py-2">
                <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                <span className="font-mono text-xs text-marble-dim">
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={onDisconnect}
                  className="text-marble-muted hover:text-gold transition-colors ml-1 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
            <span className="font-cinzel text-xs tracking-widest text-marble-muted uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></span>
              Arbitrum Sepolia
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}

// ============ Home Page ============

function HomePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (address) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address format');
      }

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const [verified, tier, revoked, burnPending, burnExecutableAt] =
        await contract.getVerificationStatus(address);

      const sealId = await contract.addressToSealId(address);

      let mintedAt = null;
      let revocationReason = '';

      if (verified) {
        const seal = await contract.sealData(sealId);
        mintedAt = Number(seal.mintedAt);
        revocationReason = seal.reason || '';
      }

      setResult({
        address,
        verified,
        tier: Number(tier),
        revoked,
        burnPending,
        burnExecutableAt: Number(burnExecutableAt),
        sealId: Number(sealId),
        mintedAt,
        revocationReason,
      });

    } catch (err) {
      console.error('Search error:', err);
      let errorMessage = 'Failed to fetch verification status';
      if (err.message.includes('Invalid address')) {
        errorMessage = 'Please enter a valid Ethereum address (should start with 0x)';
      } else if (err.message.includes('network')) {
        errorMessage = 'Network error — please check your internet connection';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed — the contract may not be deployed on this network';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim"></div>
            <div className="w-1.5 h-1.5 bg-gold rotate-45"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim"></div>
          </div>
          <h2 className="font-cinzel text-marble text-4xl md:text-5xl tracking-wide mb-6">
            Verify an Identity
          </h2>
          <p className="font-cormorant text-marble-dim text-xl italic max-w-2xl mx-auto leading-relaxed">
            Enter any wallet address to inspect its Covenant verification seal.
            All verification data is immutably recorded on-chain — no trust required.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-10 border border-gold/20 bg-tyrian-darker animate-pulse">
            <div className="border-b border-gold/10 px-8 py-5">
              <div className="h-4 bg-gold/10 rounded w-1/4"></div>
            </div>
            <div className="p-8">
              <div className="flex gap-6 mb-8">
                <div className="w-16 h-16 bg-gold/10 rounded"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-gold/10 rounded w-1/3"></div>
                  <div className="h-6 bg-gold/10 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gold/5 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-8 border-l-4 border-red-800 bg-red-950/30 px-6 py-4">
            <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
            <p className="font-cormorant text-red-300 text-lg">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="animate-fadeIn">
            <ResultDisplay result={result} />
          </div>
        )}

        {/* Feature cards */}
        {!result && !loading && !error && (
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              { label: 'Private', body: 'All personal data is stored securely off-chain.' },
              { label: 'Transparent', body: 'Anyone can verify authenticity — no trust required.' },
              { label: 'Instant', body: 'Real-time verification status read directly from the chain.' },
            ].map(({ label, body }) => (
              <div
                key={label}
                className="border border-gold/15 bg-tyrian-darker p-8 text-center hover:border-gold/35 transition-colors"
              >
                <div className="w-px h-8 bg-gradient-to-b from-gold/50 to-transparent mx-auto mb-6"></div>
                <h3 className="font-cinzel text-marble text-xs tracking-widest uppercase mb-3">{label}</h3>
                <p className="font-cormorant text-marble-muted italic text-lg leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gold/15 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-cormorant text-marble-muted italic text-sm">
                Stored on Arbitrum Sepolia
              </p>
              <p className="font-cormorant text-marble-muted/60 italic text-xs mt-0.5">
                Proof of Concept — not for production use
              </p>
            </div>
            <div className="flex gap-8">
              <a
                href={`${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-cinzel text-gold/70 hover:text-gold text-xs tracking-widest uppercase transition-colors"
              >
                View Contract
              </a>
              <a
                href="https://github.com/TonyBallo/Covenant"
                target="_blank"
                rel="noopener noreferrer"
                className="font-cinzel text-gold/70 hover:text-gold text-xs tracking-widest uppercase transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============ App ============

function App() {
  const [walletAddress, setWalletAddress] = useState(
    sessionStorage.getItem('walletAddress') || ''
  );
  const [walletConnected, setWalletConnected] = useState(
    sessionStorage.getItem('walletConnected') === 'true'
  );

  const handleConnect = async () => {
    try {
      if (!window.ethereum) {
        alert('No wallet detected. Please install MetaMask.');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      sessionStorage.setItem('walletAddress', accounts[0]);
      sessionStorage.setItem('walletConnected', 'true');
    } catch (err) {
      console.error('Wallet connection failed:', err);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress('');
    setWalletConnected(false);
    sessionStorage.removeItem('walletAddress');
    sessionStorage.removeItem('walletConnected');
  };

  return (
    <BrowserRouter>
      <Navbar
        walletAddress={walletAddress}
        walletConnected={walletConnected}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/get-verified" element={<TierSelect />} />
        <Route path="/get-verified/apply" element={<ApplyForm walletAddress={walletAddress} walletConnected={walletConnected} />} />
        <Route path="/status" element={<StatusPage walletAddress={walletAddress} />} />
        <Route path="/verify-success" element={<VerifySuccess />} />
        <Route path="/verify-failed" element={<VerifyFailed />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/vendor-demo" element={<VendorDemo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
