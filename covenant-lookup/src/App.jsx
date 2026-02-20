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

// ============ Shared Navbar ============

function Navbar({ walletAddress, walletConnected, onConnect, onDisconnect }) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/90">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-covenant-purple to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-covenant-purple to-purple-600 bg-clip-text text-transparent">
                Covenant Protocol
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Web3 Identity Verification</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/admin"
              className="px-4 py-2 text-covenant-purple hover:text-purple-700 font-semibold transition"
            >
              Admin
            </Link>
            {walletConnected && (
              <Link
                to="/status"
                className="px-4 py-2 text-covenant-purple hover:text-purple-700 font-semibold transition"
              >
                My Status
              </Link>
            )}
            <Link
              to="/get-verified"
              className="px-4 py-2 bg-covenant-purple text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Get Verified
            </Link>
            {!walletConnected ? (
              <button
                onClick={onConnect}
                className="px-4 py-2 border-2 border-covenant-purple text-covenant-purple rounded-lg font-semibold hover:bg-purple-50 transition"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg px-3 py-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-mono text-gray-700">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={onDisconnect}
                  className="text-xs text-gray-400 hover:text-red-500 transition ml-1"
                >
                  ✕
                </button>
              </div>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Sepolia Testnet
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
        errorMessage = 'Network error - please check your internet connection';
      } else if (err.code === 'CALL_EXCEPTION') {
        errorMessage = 'Contract call failed - the contract may not be deployed on this network';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Check Verification Status
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter any Ethereum address to view its Covenant verification seal.
            All data is stored on-chain and publicly verifiable.
          </p>
        </div>

        <SearchBar onSearch={handleSearch} loading={loading} />

        {loading && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-8 py-6 border-b">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="p-8">
              <div className="flex gap-6 mb-8">
                <div className="w-20 h-20 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <div className="text-xl mr-3">❌</div>
              <div>
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-fadeIn">
            <ResultDisplay result={result} />
          </div>
        )}

        {!result && !loading && !error && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Private</h3>
              <p className="text-sm text-gray-600">
                All personal data is stored securely off-chain.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Transparent</h3>
              <p className="text-sm text-gray-600">
                Anyone can verify authenticity - no trust required
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl p-6 text-center transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Instant</h3>
              <p className="text-sm text-gray-600">
                Real-time verification status with no API delays
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">Powered by Ethereum • Sepolia Testnet</p>
              <p className="text-gray-500 text-xs mt-1">Proof of Concept - Not for production use</p>
            </div>
            <div className="flex gap-6">
              <a href={`${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="text-covenant-purple hover:text-purple-700 text-sm font-semibold">View Contract</a>
              <a href="https://github.com/TonyBallo/Covenant" target="_blank" rel="noopener noreferrer" className="text-covenant-purple hover:text-purple-700 text-sm font-semibold">GitHub</a>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
