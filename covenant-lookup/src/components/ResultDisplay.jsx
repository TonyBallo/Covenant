import { TIERS, formatDate } from '../utils/constants';
import { ETHERSCAN_BASE, CONTRACT_ADDRESS } from '../utils/contract';

export function ResultDisplay({ result }) {
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

  // Color mapping for tier badges
  const tierColorClasses = {
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
  };

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
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${
            result.revoked 
              ? 'bg-red-100 text-red-800 border-red-300' 
              : 'bg-green-100 text-green-800 border-green-300'
          }`}>
            {result.revoked ? '🚫 Revoked' : '✅ Active'}
          </span>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b">
          <div className={`text-7xl font-bold ${tierTextClasses[tierInfo.color]}`}>
            {tierInfo.numeral}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">Verification Tier</p>
            <p className={`text-4xl font-bold ${tierTextClasses[tierInfo.color]} mb-2`}>
              {tierInfo.name}
            </p>
            <p className="text-sm text-gray-600">
              {tierInfo.description}
            </p>
          </div>
          <div className={`px-6 py-3 rounded-lg border-2 ${tierColorClasses[tierInfo.color]}`}>
            <div className="text-center">
              <p className="text-xs font-semibold mb-1">TIER</p>
              <p className="text-3xl font-bold">{tierInfo.numeral}</p>
            </div>
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

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Wallet Address</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm break-all flex-1 mr-4">
              {result.address}
            </p>
            
            <a
              href={`${ETHERSCAN_BASE}/address/${result.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-covenant-purple hover:text-purple-700 text-sm font-semibold whitespace-nowrap"
            >
              View on Etherscan
            </a>
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