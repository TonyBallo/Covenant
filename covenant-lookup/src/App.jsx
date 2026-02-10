import { useState } from 'react';
import { ethers } from 'ethers';
import { SearchBar } from './components/SearchBar';
import { ResultDisplay } from './components/ResultDisplay';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE } from './utils/contract';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (address) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validate address format
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Create provider (read-only, no wallet needed)
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Query verification status
      const [verified, tier, revoked, burnPending, burnExecutableAt] = 
        await contract.getVerificationStatus(address);

      // Get seal ID
      const sealId = await contract.addressToSealId(address);

      // Get additional seal data if verified
      let mintedAt = null;
      let revocationReason = '';

      if (verified) {
        const sealData = await contract.sealData(sealId);
        mintedAt = Number(sealData.mintedAt);
        revocationReason = sealData.reason || '';
      }

      // Set result
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
      
      // User-friendly error messages
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-covenant-purple">
                Covenant Protocol
              </h1>
              <p className="text-gray-600 mt-1">
                Web3 Identity Verification Lookup
              </p>
            </div>
            <div className="hidden md:block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                Sepolia Testnet
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Check Verification Status
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter any Ethereum address to view its Covenant verification seal.
            All data is stored on-chain and publicly verifiable.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} loading={loading} />

        {/* Error Message */}
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

        {/* Results */}
        {result && <ResultDisplay result={result} />}

        {/* Info Cards - Only show when no results */}
        {!result && !loading && !error && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-bold text-gray-900 mb-2">On-Chain</h3>
              <p className="text-sm text-gray-600">
                All verification data is stored immutably on Ethereum blockchain
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-bold text-gray-900 mb-2">Transparent</h3>
              <p className="text-sm text-gray-600">
                Anyone can verify authenticity - no trust required
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Instant</h3>
              <p className="text-sm text-gray-600">
                Real-time verification status with no API delays
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-gray-600 text-sm">
                Powered by Ethereum • Sepolia Testnet
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Proof of Concept - Not for production use
              </p>
            </div>
            <div className="flex gap-6">
              
              <a
                href={`${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-covenant-purple hover:text-purple-700 text-sm font-semibold"
              >
                View Contract
              </a>
              <a
                href="https://github.com/yourusername/covenant"
                target="_blank"
                rel="noopener noreferrer"
                className="text-covenant-purple hover:text-purple-700 text-sm font-semibold"
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

export default App;