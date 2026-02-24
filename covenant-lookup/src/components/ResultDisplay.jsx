import { TIERS, formatDate } from '../utils/constants';
import { ETHERSCAN_BASE, CONTRACT_ADDRESS } from '../utils/contract';
import { getCrossChainStatus } from '../utils/api';
import { useState, useEffect } from 'react';

export function ResultDisplay({ result }) {
  const [chainStatus, setChainStatus] = useState({ ethereum: true, polygon: false });

  // Load cross-chain status when result changes
  useEffect(() => {
    if (result.verified) {
      getCrossChainStatus(result.address)
        .then(status => setChainStatus(status))
        .catch(err => console.error('Failed to load chain status:', err));
    }
  }, [result.address, result.verified]);
  // Not verified - show empty state
  if (!result.verified) {
    return (
      <div className="mt-8 bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No Verification Found
        </h3>
        <p className="text-gray-600 mb-4">
          This address does not have a Covenant verification seal.
        </p>
        <div className="bg-gray-50 rounded p-4 max-w-lg mx-auto">
          <p className="text-xs text-gray-600 mb-1">Searched Address</p>
          <p className="font-mono text-sm break-all text-gray-800">
            {result.address}
          </p>
        </div>
      </div>
    );
  }

  const tierInfo = TIERS[result.tier];
  const mintDate = formatDate(result.mintedAt);

  const tierTextClasses = {
    orange: 'text-orange-600',
    gray: 'text-gray-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-8 py-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">
            Verification Seal
          </h3>
          <div className="flex items-center gap-2">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              result.revoked 
                ? 'bg-red-100 text-red-800 border-red-300' 
                : 'bg-green-100 text-green-800 border-green-300'
            }`}>
              {result.revoked ? '🚫 Revoked' : '✅ Active'}
            </span>
            {chainStatus.ethereum && (
              <span className="text-2xl" title="Verified on Ethereum">
                ⟠
              </span>
            )}
            {chainStatus.polygon && (
              <span className="text-2xl" title="Attested on Polygon">
                🟣
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6 pb-6 border-b">
          {/* Centered Emblem with Black Background - Fixed Height */}
          <div className="flex justify-center items-center mb-6 bg-black h-80 -mx-8">
            <div className="w-128 h-128 flex items-center justify-center">
              <img 
                src="/seals/tier1-bronze.png" 
                alt="Tier I Bronze Seal" 
                className="w-full h-full object-contain drop-shadow-lg"
              />
            </div>
          </div>
          
          {/* Centered Tier Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Verification Tier</p>
            <p className={`text-4xl font-bold ${tierTextClasses[tierInfo.color]} mb-2`}>
              {tierInfo.name}
            </p>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              {tierInfo.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Seal ID</p>
            <p className="font-mono font-bold text-lg">#{result.sealId}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Issued</p>
            <p className="font-semibold text-lg">{mintDate}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Status</p>
            <p className="font-semibold text-lg">
              {result.revoked ? (
                <span className="text-red-600">Revoked</span>
              ) : (
                <span className="text-green-600">Active</span>
              )}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1 uppercase tracking-wide">Burn Status</p>
            <p className="font-semibold text-lg">
              {result.burnPending ? (
                <span className="text-yellow-600">Pending</span>
              ) : (
                <span className="text-gray-600">None</span>
              )}
            </p>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Wallet Address</p>
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-sm break-all flex-1">
              {result.address}
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.address);
                  alert('Address copied!');
                }}
                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold transition"
                title="Copy address"
              >
                📋 Copy
              </button>
              <a
                href={`${ETHERSCAN_BASE}/address/${result.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-covenant-purple hover:bg-purple-700 text-white rounded text-sm font-semibold transition whitespace-nowrap"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        </div>

        {result.revoked && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <p className="text-red-800 font-bold">Verification Revoked</p>
                <p className="text-red-700 text-sm mt-1">
                  This seal has been revoked and should not be trusted for protocol access.
                  The verification may have been compromised or violated terms of service.
                </p>
              </div>
            </div>
          </div>
        )}

        {result.burnPending && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div className="flex items-start">
              <div className="text-2xl mr-3">🔥</div>
              <div>
                <p className="text-yellow-800 font-bold">Burn Pending</p>
                <p className="text-yellow-700 text-sm mt-1">
                  The owner has requested deletion of this verification seal.
                  After the 90-day delay period, this seal will be permanently deleted.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <p className="text-xs text-gray-600 mb-2 text-center">
            This data is stored on-chain and can be independently verified
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href={`${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-covenant-purple hover:underline"
            >
              View Contract
            </a>
            <span className="text-gray-300">•</span>
            <a
              href={`${ETHERSCAN_BASE}/address/${result.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-covenant-purple hover:underline"
            >
              View Address
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}