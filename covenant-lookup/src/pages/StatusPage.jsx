import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { checkKYCStatus } from '../utils/api';
import { TIERS, formatDate } from '../utils/constants';
import { CONTRACT_ADDRESS, CONTRACT_ABI, RPC_URL, ETHERSCAN_BASE } from '../utils/contract';

export function StatusPage({ walletAddress }) {
  const navigate = useNavigate();
  const [kycStatus, setKycStatus] = useState(null);
  const [sealData, setSealData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if no wallet connected
  useEffect(() => {
    if (!walletAddress) {
      navigate('/');
    }
  }, [walletAddress, navigate]);

  // Load status on mount
  useEffect(() => {
    if (!walletAddress) return;
    const loadStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check application status from backend
        const status = await checkKYCStatus(walletAddress);
        setKycStatus(status);

        // If minted, also fetch on-chain seal data
        if (status.status === 'minted' || status.status === 'approved') {
          const provider = new ethers.JsonRpcProvider(RPC_URL);
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const [verified, tier, revoked, burnPending] = await contract.getVerificationStatus(walletAddress);
          
          if (verified) {
            const sealId = await contract.addressToSealId(walletAddress);
            const seal = await contract.sealData(sealId);
            setSealData({
              verified,
              tier: Number(tier),
              revoked,
              burnPending,
              sealId: Number(sealId),
              mintedAt: Number(seal.mintedAt)
            });
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStatus();
  }, [walletAddress]);

  // Tier color helpers
  const tierTextClasses = {
    orange: 'text-orange-500',
    gray: 'text-gray-500',
    yellow: 'text-yellow-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-covenant-purple border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-sm text-covenant-purple hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Status</h1>
          <p className="text-sm font-mono text-gray-500">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* No Submission */}
        {!kycStatus?.hasSubmission && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Application Found</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted a verification application yet.
            </p>
            <Link
              to="/get-verified"
              className="inline-block bg-covenant-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Apply for Verification
            </Link>
          </div>
        )}

        {/* Pending */}
        {kycStatus?.hasSubmission && kycStatus.status === 'pending' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h3>
            <p className="text-gray-600 mb-6">
              Your Tier {kycStatus.tierRequested} application is pending review.
              This typically takes 1-2 business days.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
              <p className="font-semibold text-gray-800">
                {new Date(kycStatus.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        )}

        {/* Rejected */}
        {kycStatus?.hasSubmission && kycStatus.status === 'rejected' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Rejected</h3>
            <p className="text-gray-600 mb-4">
              Unfortunately your application was not approved.
            </p>
            {kycStatus.rejectionReason && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 text-left mb-6 rounded">
                <p className="text-xs text-red-600 uppercase tracking-wide mb-1">Reason</p>
                <p className="text-red-800 font-semibold">{kycStatus.rejectionReason}</p>
              </div>
            )}
            <Link
              to="/get-verified"
              className="inline-block bg-covenant-purple text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              Apply Again
            </Link>
          </div>
        )}

        {/* Minted - Identity Card */}
        {sealData?.verified && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

            {/* Card Header */}
            <div className="bg-gradient-to-r from-covenant-purple to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">
                    Covenant Protocol
                  </p>
                  <p className="text-white text-xl font-bold">Identity Seal</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
              </div>
            </div>

            {/* Tier Display */}
            <div className={`px-8 py-6 border-b flex items-center gap-6 
              ${sealData.revoked ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className={`text-6xl font-bold ${tierTextClasses[TIERS[sealData.tier].color]}`}>
                {TIERS[sealData.tier].numeral}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Verification Tier</p>
                <p className={`text-3xl font-bold ${tierTextClasses[TIERS[sealData.tier].color]}`}>
                  {TIERS[sealData.tier].name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {TIERS[sealData.tier].description}
                </p>
              </div>
            </div>

            {/* Seal Attributes */}
            <div className="px-8 py-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Seal ID</p>
                <p className="font-mono font-bold text-lg">#{sealData.sealId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Issued</p>
                <p className="font-semibold">{formatDate(sealData.mintedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <p className="font-semibold">
                  {sealData.revoked
                    ? <span className="text-red-600">Revoked 🚫</span>
                    : <span className="text-green-600">Active ✅</span>
                  }
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Burn Status</p>
                <p className="font-semibold">
                  {sealData.burnPending
                    ? <span className="text-yellow-600">Pending 🔥</span>
                    : <span className="text-gray-500">None</span>
                  }
                </p>
              </div>
            </div>

            {/* Wallet Address */}
            <div className="px-8 pb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Wallet Address</p>
                <p className="font-mono text-sm break-all text-gray-800">{walletAddress}</p>
              </div>
            </div>

            {/* Revoked Warning */}
            {sealData.revoked && (
              <div className="mx-8 mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-800 font-bold text-sm">⚠️ Verification Revoked</p>
                <p className="text-red-700 text-xs mt-1">
                  This seal has been revoked and should not be used for protocol access.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="px-8 pb-6 pt-4 border-t">
              <div className="flex flex-col gap-3">
                <a
                  href={`${ETHERSCAN_BASE}/nft/${CONTRACT_ADDRESS}/${sealData.sealId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-covenant-purple hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <span>🔍</span>
                  View NFT on Etherscan
                </a>
                
                <div className="flex justify-between items-center text-xs">
                  <p className="text-gray-400">Stored on Ethereum • Sepolia Testnet</p>
                  <a
                    href={`${ETHERSCAN_BASE}/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-covenant-purple hover:underline font-semibold"
                  >
                    View Wallet →
                  </a>
                </div>
                
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Add to MetaMask Manually</p>
                  <p className="text-xs font-mono text-gray-700">
                    Contract: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}
                  </p>
                  <p className="text-xs font-mono text-gray-700">
                    Token ID: {sealData.sealId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
