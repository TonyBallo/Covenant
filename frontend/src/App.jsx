import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { WalletShowcase } from './components/WalletShowcase';
import { ResultDisplay } from './components/ResultDisplay';
import { TierSelect } from './pages/TierSelect';
import { ApplyForm } from './pages/ApplyForm';
import { StatusPage } from './pages/StatusPage';
import { VerifySuccess } from './pages/VerifySuccess';
import { VerifyFailed } from './pages/VerifyFailed';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE } from './utils/contract';
import { Admin } from './pages/Admin';
import { VendorDemo } from './pages/VendorDemo';
import { Docs } from './pages/Docs';
import { Landing } from './pages/Landing';
import { MintCeremony } from './pages/MintCeremony';
import { About } from './pages/About';
import { Waitlist } from './pages/Waitlist';
import { DemoIntro } from './pages/DemoIntro';
import { ForMembers } from './pages/ForMembers';
import { ForProtocols } from './pages/ForProtocols';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ============ Shared Navbar ============

function Navbar({ walletAddress, walletConnected, onConnect, onDisconnect }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-tyrian-darker/95 border-b border-gold/20 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          <Link to="/" className="flex items-center gap-4" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-9 h-9 border border-gold/50 flex items-center justify-center">
              <span className="font-cinzel text-gold font-semibold text-lg leading-none">C</span>
            </div>
            <div>
              <h1 className="font-cinzel text-marble tracking-[0.2em] uppercase text-base leading-tight">
                Covenant
              </h1>
              <p className="font-cormorant text-marble-muted italic text-xs tracking-wider leading-tight">
                Trust Network
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/demo"
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Lookup
            </Link>
            {walletConnected && (
              <Link
                to="/demo/status"
                className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
              >
                My Status
              </Link>
            )}
            <Link
              to="/demo/docs"
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/demo/get-verified"
              className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/60 text-gold hover:bg-gold/10 transition-colors"
            >
              Get Your Seal
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-marble-muted hover:text-gold transition-colors text-xl p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gold/15 mt-4 pt-4 pb-2 flex flex-col gap-1">
            <Link
              to="/demo"
              onClick={() => setMobileMenuOpen(false)}
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase py-3 transition-colors"
            >
              Lookup
            </Link>
            {walletConnected && (
              <Link
                to="/demo/status"
                onClick={() => setMobileMenuOpen(false)}
                className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase py-3 transition-colors"
              >
                My Status
              </Link>
            )}
            <Link
              to="/demo/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase py-3 transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/demo/get-verified"
              onClick={() => setMobileMenuOpen(false)}
              className="font-cinzel text-gold text-xs tracking-widest uppercase py-3 transition-colors"
            >
              Get Your Seal
            </Link>
            <div className="border-t border-gold/10 mt-2 pt-3 flex flex-col gap-3">
              {!walletConnected ? (
                <button
                  onClick={() => { onConnect(); setMobileMenuOpen(false); }}
                  className="font-cinzel text-xs tracking-widest uppercase py-3 border border-gold/30 text-marble-muted hover:border-gold/60 hover:text-gold transition-colors w-full"
                >
                  Connect Wallet
                </button>
              ) : (
                <div className="flex items-center justify-between bg-gold/10 border border-gold/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
                    <span className="font-mono text-xs text-marble-dim">
                      {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={() => { onDisconnect(); setMobileMenuOpen(false); }}
                    className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              )}
              <span className="font-cinzel text-xs tracking-widest text-marble-muted/60 uppercase flex items-center gap-2 pb-1">
                <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></span>
                Arbitrum Sepolia
              </span>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}

// ============ Home Page ============

function HomePage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchHovered, setSearchHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { key: locationKey } = useLocation();

  // Reset to showcase view on every navigation to this page
  useEffect(() => {
    setResult(null);
    setError(null);
    setSearchInput('');
  }, [locationKey]);

  const handleSearch = async (address) => {
    // Validate address before touching any state — keeps the current view intact on bad input
    let normalized;
    try {
      try {
        normalized = ethers.getAddress(address);
      } catch {
        normalized = ethers.getAddress(address.toLowerCase());
      }
    } catch {
      setError('Please enter a valid Ethereum address (should start with 0x)');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const [verified, tier, revoked, burnPending, burnExecutableAt] =
        await contract.getVerificationStatus(normalized);

      const sealId = await contract.addressToSealId(normalized);

      let mintedAt = null;
      let expiresAt = 0;
      let revocationReason = '';
      let expired = false;
      let jurisdictionCode = 0;
      let covenantSignature = null;
      if (verified) {
        const [seal, isExpiredResult] = await Promise.all([
          contract.sealData(sealId),
          contract.isExpired(normalized),
        ]);
        mintedAt = Number(seal.mintedAt);
        revocationReason = seal.revocationReason || '';
        expired = isExpiredResult;
        jurisdictionCode = Number(seal.jurisdictionCode);
        covenantSignature = seal.covenantSignature;
        expiresAt = Number(seal.expiresAt);
      }

      setResult({
        address: normalized,
        verified,
        tier: Number(tier),
        revoked,
        burnPending,
        burnExecutableAt: Number(burnExecutableAt),
        sealId: Number(sealId),
        mintedAt,
        expiresAt,
        revocationReason,
        isExpired: expired,
        jurisdictionCode,
        covenantSignature,
      });

    } catch (err) {
      console.error('Search error:', err);
      let errorMessage = 'Failed to fetch verification status';
      if (err.message.includes('network')) {
        errorMessage = 'Network error — please check your internet connection';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed — the contract may not be deployed on this network';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) handleSearch(searchInput.trim());
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
    setSearchInput('');
  };

  return (
    <div className="min-h-screen">
      <main className={`max-w-5xl mx-auto px-6 ${result ? 'py-2' : 'py-10 md:py-14'}`}>

        {/* Search bar — expands from icon on hover/focus */}
        {(() => {
          const isOpen = searchHovered || searchFocused || !!searchInput || !!result || !!error;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: result ? '8px' : '28px' }}>
              <style>{`
                @keyframes searchGlow {
                  0%, 100% { box-shadow: 0 0 5px rgba(212,175,90,0.08), 0 0 12px rgba(212,175,90,0.06); }
                  50%       { box-shadow: 0 0 14px rgba(212,175,90,0.28), 0 0 28px rgba(212,175,90,0.14); }
                }
                @keyframes searchIconGlow {
                  0%, 100% { filter: drop-shadow(0 0 2px rgba(212,175,90,0.2)); }
                  50%       { filter: drop-shadow(0 0 7px rgba(212,175,90,0.65)); }
                }
              `}</style>
              <form onSubmit={handleSubmit}>
                <div
                  onMouseEnter={() => setSearchHovered(true)}
                  onMouseLeave={() => setSearchHovered(false)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    background: 'rgba(10,0,6,0.55)',
                    border: `1px solid ${isOpen ? 'rgba(212,175,90,0.4)' : 'rgba(212,175,90,0.22)'}`,
                    width: isOpen ? 'min(460px, calc(100vw - 48px))' : '44px',
                    height: '44px',
                    overflow: 'hidden',
                    transition: 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s, box-shadow 0.3s',
                    cursor: isOpen ? 'text' : 'pointer',
                    animation: isOpen ? 'none' : 'searchGlow 3s ease-in-out infinite',
                    boxShadow: isOpen ? '0 0 20px rgba(212,175,90,0.2), 0 0 40px rgba(212,175,90,0.08)' : undefined,
                  }}
                >
                  {/* Icon — always visible, fixed width */}
                  <div style={{ flexShrink: 0, width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg
                    style={{
                      color: isOpen ? 'rgba(212,175,90,0.55)' : 'rgba(212,175,90,0.35)',
                      transition: 'color 0.25s, filter 0.3s',
                      animation: isOpen ? 'none' : 'searchIconGlow 3s ease-in-out infinite',
                      filter: isOpen ? 'drop-shadow(0 0 6px rgba(212,175,90,0.5))' : undefined,
                    }}
                    width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                  </div>
                  {/* Input — revealed as container widens */}
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Enter wallet address  0x…"
                    style={{
                      flex: 1, minWidth: 0,
                      background: 'none', border: 'none', outline: 'none',
                      fontFamily: 'monospace', fontSize: '12px',
                      color: 'rgba(255,255,255,0.72)',
                      letterSpacing: '0.04em',
                      opacity: isOpen ? 1 : 0,
                      transition: 'opacity 0.15s',
                      paddingRight: '4px',
                    }}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck="false"
                  />
                  {/* Right action */}
                  <div style={{ flexShrink: 0, width: '40px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isOpen ? 1 : 0, transition: 'opacity 0.15s' }}>
                    {loading ? (
                      <span className="animate-spin" style={{ width: '12px', height: '12px', border: '1px solid rgba(212,175,90,0.45)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                    ) : searchInput.trim() ? (
                      <button
                        type="submit"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(212,175,90,0.55)', padding: 0, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#d4af5a'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,175,90,0.55)'}
                      >
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
              {!isOpen && !error && (
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: 'rgba(255,255,255,0.2)', fontSize: '13px', marginTop: '10px', letterSpacing: '0.03em' }}>
                  Look up any wallet address
                </p>
              )}
              {error && (
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', color: '#fca5a5', fontSize: '12px', marginTop: '8px' }}>{error}</p>
              )}
              {(result || error) && !loading && (
                <button
                  onClick={handleClear}
                  style={{ marginTop: '8px', fontFamily: 'Cinzel, serif', fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(212,175,90,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
                >
                  ← Clear
                </button>
              )}
            </div>
          );
        })()}

        {/* Title — hidden when result is displayed */}
        {!result && (
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-5 opacity-50">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold-dim"></div>
              <div className="w-1 h-1 bg-gold rotate-45"></div>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold-dim"></div>
            </div>
            <h2 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-4">
              Member Lookup
            </h2>
            <p className="font-cormorant text-marble-dim text-lg italic leading-relaxed">
              Verify any wallet's standing in the Covenant trust network — instantly, on-chain.
            </p>
          </div>
        )}

        {/* Main area */}
        {loading && (
          <div className="border border-gold/20 bg-tyrian-darker animate-pulse">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gold/5 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="animate-fadeIn flex flex-col items-center -mt-2">
            <div className="w-full max-w-2xl">
              <ResultDisplay result={result} />
            </div>
          </div>
        )}

        {!result && !loading && (
          <>
            <WalletShowcase onSearch={(addr) => { setSearchInput(addr); handleSearch(addr); }} />
            <p className="text-center mt-6 font-cormorant text-marble-muted/60 italic text-base">
              Don't have a seal?{' '}
              <Link to="/demo/get-verified" className="text-gold/70 hover:text-gold transition-colors not-italic font-cinzel text-xs tracking-widest uppercase">
                Apply for verification →
              </Link>
            </p>
          </>
        )}

      </main>
    </div>
  );
}

// ============ Demo Footer ============

function DemoFooter() {
  return (
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
            <Link
              to="/about"
              className="font-cinzel text-gold/70 hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              About
            </Link>
            <Link
              to="/demo/docs"
              className="font-cinzel text-gold/70 hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Docs
            </Link>
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
  );
}

// ============ Demo Layout (Navbar + page outlet) ============

function DemoLayout({ walletAddress, walletConnected, onConnect, onDisconnect }) {
  return (
    <>
      <Navbar
        walletAddress={walletAddress}
        walletConnected={walletConnected}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
      <Outlet />
      <DemoFooter />
    </>
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
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        } else {
          alert('No wallet detected. Please install MetaMask.');
        }
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
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/demo/mint-ceremony" element={<MintCeremony />} />
        <Route element={
          <DemoLayout
            walletAddress={walletAddress}
            walletConnected={walletConnected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        }>
          <Route path="/demo/intro" element={<DemoIntro />} />
          <Route path="/demo/for-members" element={<ForMembers />} />
          <Route path="/demo/for-protocols" element={<ForProtocols />} />
          <Route path="/demo" element={<HomePage />} />
          <Route path="/demo/get-verified" element={<TierSelect />} />
          <Route path="/demo/get-verified/apply" element={<ApplyForm walletAddress={walletAddress} walletConnected={walletConnected} />} />
          <Route path="/demo/status" element={<StatusPage walletAddress={walletAddress} />} />
          <Route path="/demo/verify-success" element={<VerifySuccess />} />
          <Route path="/demo/verify-failed" element={<VerifyFailed />} />
          <Route path="/demo/admin" element={<Admin />} />
          <Route path="/demo/vendor-demo" element={<VendorDemo />} />
          <Route path="/demo/docs" element={<Docs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
