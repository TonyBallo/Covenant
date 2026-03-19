import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL } from '../utils/contract';

// ============ Mock Dashboard (shown when access is granted) ============

function ProtectedDashboard({ walletAddress }) {
  return (
    <div className="space-y-6">

      {/* Access granted header */}
      <div className="border border-gold/40 bg-tyrian-darker overflow-hidden">
        <div className="bg-tyrian-dark border-b border-gold/25 px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between">
          <div>
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
              Protected Protocol
            </p>
            <p className="font-cinzel text-gold text-lg tracking-wide">Access Granted</p>
          </div>
          <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 px-3 py-2">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse"></span>
            <span className="font-cinzel text-gold text-xs tracking-widest uppercase">Verified</span>
          </div>
        </div>
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <p className="font-cormorant text-marble text-xl italic mb-2">
            Your Covenant seal has been verified. Welcome to Protected Protocol.
          </p>
          <p className="font-mono text-marble-muted text-xs break-all">{walletAddress}</p>
        </div>
      </div>

      {/* Mock dashboard */}
      <div className="border border-gold/20 bg-tyrian-darker overflow-hidden">
        <div className="border-b border-gold/15 px-8 py-5">
          <h2 className="font-cinzel text-marble text-base tracking-widest uppercase">
            Protected Protocol Dashboard
          </h2>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gold/10 border-b border-gold/15">
          {[
            { label: 'Total Value Locked', value: '$4,821,300', change: '+2.4%' },
            { label: 'Your Position',      value: '$12,450',   change: '+0.8%' },
            { label: 'Yield (30d)',         value: '6.12%',     change: '+0.3%' },
          ].map(({ label, value, change }) => (
            <div key={label} className="bg-tyrian-darker px-5 py-4 sm:px-6 sm:py-5">
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">{label}</p>
              <p className="font-cinzel text-marble text-2xl tracking-wide mb-1">{value}</p>
              <p className="font-cormorant text-gold italic text-sm">{change} this week</p>
            </div>
          ))}
        </div>

        {/* Mock activity feed */}
        <div className="px-8 py-6">
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-4">
            Recent Activity
          </p>
          <div className="space-y-3">
            {[
              { type: 'Deposit',    amount: '+500 USDC',  time: '2 hours ago',   status: 'Confirmed' },
              { type: 'Yield',      amount: '+1.24 USDC', time: '8 hours ago',   status: 'Confirmed' },
              { type: 'Deposit',    amount: '+200 USDC',  time: '3 days ago',    status: 'Confirmed' },
              { type: 'Withdrawal', amount: '-150 USDC',  time: '5 days ago',    status: 'Confirmed' },
            ].map(({ type, amount, time, status }, i) => (
              <div key={i} className="flex items-center justify-between border border-gold/10 bg-tyrian-dark px-5 py-3">
                <div>
                  <p className="font-cinzel text-marble text-xs tracking-wide">{type}</p>
                  <p className="font-cormorant text-marble-muted italic text-sm">{time}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${amount.startsWith('+') ? 'text-gold' : 'text-marble-dim'}`}>
                    {amount}
                  </p>
                  <p className="font-cinzel text-marble-muted text-xs tracking-widest">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mock action buttons */}
        <div className="px-5 pb-6 sm:px-8 sm:pb-8 flex flex-wrap gap-4">
          <button className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors">
            Deposit
          </button>
          <button className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 transition-colors">
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Access Restricted ============

function AccessRestricted() {
  return (
    <div className="border border-red-900/50 bg-tyrian-darker overflow-hidden">
      <div className="bg-tyrian-dark border-b border-red-900/30 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
            Protected Protocol
          </p>
          <p className="font-cinzel text-red-400 text-lg tracking-wide">Access Restricted</p>
        </div>
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/40 px-3 py-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="font-cinzel text-red-400 text-xs tracking-widest uppercase">Denied</span>
        </div>
      </div>
      <div className="px-8 py-10 text-center">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-red-800/50 to-transparent mx-auto mb-8"></div>
        <p className="font-cormorant text-marble text-2xl italic mb-4 leading-relaxed">
          Protected Protocol requires a minimum Silver (Tier II) Covenant seal to access this platform.
        </p>
        <p className="font-cormorant text-marble-muted italic text-lg mb-10">
          Obtain a Covenant verification seal to unlock access.
        </p>
        <Link
          to="/get-verified"
          className="font-cinzel text-xs tracking-widest uppercase px-8 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
        >
          Get Verified
        </Link>
      </div>
    </div>
  );
}

// ============ VendorDemo Page ============

export function VendorDemo() {
  const [walletAddress, setWalletAddress] = useState(
    sessionStorage.getItem('walletAddress') || ''
  );
  const [walletConnected, setWalletConnected] = useState(
    sessionStorage.getItem('walletConnected') === 'true'
  );
  const [checking, setChecking] = useState(false);
  const [accessGranted, setAccessGranted] = useState(null); // null = not yet checked
  const [error, setError] = useState(null);

  const connectAndCheck = async () => {
    setError(null);
    try {
      let address = walletAddress;

      if (!walletConnected) {
        if (!window.ethereum) {
          const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
          if (isMobile) {
            window.location.href = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
          } else {
            alert('No wallet detected. Please install MetaMask.');
          }
          return;
        }
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        address = accounts[0];
        setWalletAddress(address);
        setWalletConnected(true);
        sessionStorage.setItem('walletAddress', address);
        sessionStorage.setItem('walletConnected', 'true');
      }

      setChecking(true);
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const valid = await contract.isValid(address, 2);
      setAccessGranted(valid);
    } catch (err) {
      console.error('Vendor demo check failed:', err);
      setError('Failed to verify seal status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Demo banner */}
        <div className="border border-gold/20 bg-gold/5 px-6 py-3 mb-10 flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0"></span>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">
            Vendor Integration Demo — This page simulates how a protocol uses Covenant to gate access
          </p>
        </div>

        {/* Page header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim"></div>
            <div className="w-1.5 h-1.5 bg-gold rotate-45"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim"></div>
          </div>
          <h1 className="font-cinzel text-marble text-4xl tracking-wide mb-4">Protected Protocol</h1>
          <p className="font-cormorant text-marble-dim text-xl italic max-w-lg mx-auto leading-relaxed">
            This protocol uses Covenant to verify member identity before granting access.
            Silver (Tier II) seal or above required.
          </p>
        </div>

        {/* Not yet connected */}
        {!walletConnected && accessGranted === null && (
          <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-8"></div>
            <p className="font-cormorant text-marble text-xl italic mb-8">
              Connect your wallet to verify your Covenant seal and access the protocol.
            </p>
            <button
              onClick={connectAndCheck}
              className="font-cinzel text-xs tracking-widest uppercase px-8 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Connected but not yet checked */}
        {walletConnected && accessGranted === null && !checking && (
          <div className="border border-gold/20 bg-tyrian-darker p-10 text-center">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-6"></div>
            <p className="font-mono text-marble-muted text-xs mb-2">Connected</p>
            <p className="font-mono text-marble text-sm mb-8 break-all">
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </p>
            <button
              onClick={connectAndCheck}
              className="font-cinzel text-xs tracking-widest uppercase px-8 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
            >
              Verify Seal Access
            </button>
          </div>
        )}

        {/* Loading */}
        {checking && (
          <div className="border border-gold/20 bg-tyrian-darker py-16 text-center">
            <div className="w-10 h-10 border border-gold/50 border-t-gold rounded-full animate-spin mx-auto mb-6"></div>
            <p className="font-cormorant text-marble-muted italic text-lg">Verifying Covenant seal…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border-l-4 border-red-800 bg-red-950/30 px-6 py-4 mb-6">
            <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Error</p>
            <p className="font-cormorant text-red-300 text-lg">{error}</p>
          </div>
        )}

        {/* Result */}
        {!checking && accessGranted === true && (
          <ProtectedDashboard walletAddress={walletAddress} />
        )}
        {!checking && accessGranted === false && (
          <AccessRestricted />
        )}

        {/* Integration note */}
        {!checking && accessGranted !== null && (
          <div className="mt-8 border border-gold/10 bg-tyrian-dark px-6 py-5">
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
              How this works
            </p>
            <p className="font-cormorant text-marble-muted italic text-base leading-relaxed">
              This page called <span className="font-mono text-marble-dim not-italic">isValid(address, 2)</span> on
              the Covenant Pact contract and gated content based on the result — no backend required.
              Any protocol can integrate this single read call to verify member identity on-chain.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
