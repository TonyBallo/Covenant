import { TIERS, formatDate } from '../utils/constants';
import { ETHERSCAN_BASE, CONTRACT_ADDRESS } from '../utils/contract';
import { getCrossChainStatus } from '../utils/api';
import { useState, useEffect } from 'react';

// Dark-theme tier color maps (keyed by TIERS[n].color string)
const tierTextClass = {
  orange: 'text-gold',
  gray:   'text-marble-dim',
  yellow: 'text-gold',
  blue:   'text-blue-300',
  purple: 'text-purple-300',
};


export function ResultDisplay({ result }) {
  const [chainStatus, setChainStatus] = useState({ ethereum: true, polygon: false });

  useEffect(() => {
    if (result.verified) {
      getCrossChainStatus(result.address)
        .then(status => setChainStatus(status))
        .catch(err => console.error('Failed to load chain status:', err));
    }
  }, [result.address, result.verified]);

  // Not verified
  if (!result.verified) {
    return (
      <div className="mt-10 border border-gold/20 bg-tyrian-darker p-10 text-center">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-gold/40 to-transparent mx-auto mb-6"></div>
        <h3 className="font-cinzel text-marble text-xl tracking-wide mb-3">
          No Verification Found
        </h3>
        <p className="font-cormorant text-marble-muted italic text-lg mb-6">
          This address does not hold a Covenant verification seal.
        </p>
        <div className="border border-gold/10 bg-tyrian-dark px-6 py-3 max-w-lg mx-auto">
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Searched Address</p>
          <p className="font-mono text-sm text-marble-dim break-all">{result.address}</p>
        </div>
      </div>
    );
  }

  const tierInfo = TIERS[result.tier];
  const mintDate = formatDate(result.mintedAt);

  return (
    <div className="mt-10 border border-gold/30 bg-tyrian-darker overflow-hidden">

      {/* Header */}
      <div className="bg-tyrian-dark border-b border-gold/20 px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-cinzel text-marble tracking-widest uppercase text-sm">
            Verification Seal
          </h3>
          <div className="flex items-center gap-3">
            <span className={`font-cinzel text-xs tracking-widest uppercase px-3 py-1 border ${
              result.revoked
                ? 'border-red-800/60 text-red-400 bg-red-950/30'
                : 'border-gold/40 text-gold bg-gold/10'
            }`}>
              {result.revoked ? 'Revoked' : 'Active'}
            </span>
            {chainStatus.ethereum && (
              <span className="text-gold text-lg font-cinzel" title="Verified on Arbitrum">⟠</span>
            )}
            {chainStatus.polygon && (
              <span className="text-purple-400 text-lg" title="Attested on Polygon">⬡</span>
            )}
          </div>
        </div>
      </div>

      {/* Seal image — full width, no padding */}
      {result.tier >= 1 && result.tier <= 4 ? (
        <img
          src={`/tiers/tier-${result.tier}.png`}
          alt={`Tier ${result.tier} seal`}
          className="w-full h-auto block border-b border-gold/10"
        />
      ) : (
        <div className="w-full aspect-video border-b border-gold/10 bg-tyrian-dark flex flex-col items-center justify-center gap-2">
          <span className={`font-cinzel font-bold text-4xl leading-none ${tierTextClass[tierInfo.color]}`}>
            {tierInfo.numeral}
          </span>
          <span className="font-cinzel text-marble-muted/30 text-xs tracking-widest uppercase">Coming Soon</span>
        </div>
      )}

      {/* Tier row */}
      <div className={`px-5 py-5 sm:px-8 sm:py-6 border-b border-gold/15 flex items-center gap-4 sm:gap-6 ${result.revoked ? 'bg-red-950/20' : ''}`}>
        <div className={`font-cinzel text-5xl sm:text-6xl font-bold leading-none ${tierTextClass[tierInfo.color]}`}>
          {tierInfo.numeral}
        </div>
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Verification Tier</p>
          <p className={`font-cinzel text-xl sm:text-2xl tracking-wide ${tierTextClass[tierInfo.color]}`}>
            {tierInfo.name}
          </p>
        </div>
      </div>

      {/* Data grid */}
      <div className="px-5 py-5 sm:px-8 sm:py-6 grid grid-cols-2 gap-4">
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Seal ID</p>
          <p className="font-mono text-marble font-bold text-lg">#{result.sealId}</p>
        </div>
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Issued</p>
          <p className="font-cormorant text-marble text-lg">{mintDate}</p>
        </div>
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Status</p>
          <p className={`font-cormorant text-lg font-semibold ${result.revoked ? 'text-red-400' : 'text-gold'}`}>
            {result.revoked ? 'Revoked' : 'Active'}
          </p>
        </div>
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Burn Status</p>
          <p className={`font-cormorant text-lg font-semibold ${result.burnPending ? 'text-gold/70' : 'text-marble-muted'}`}>
            {result.burnPending ? 'Pending' : 'None'}
          </p>
        </div>
      </div>

      {/* Wallet address */}
      <div className="px-5 pb-5 sm:px-8 sm:pb-6">
        <div className="border border-gold/10 bg-tyrian-dark px-5 py-4">
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">Wallet Address</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <p className="font-mono text-sm text-marble-dim break-all flex-1">{result.address}</p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigator.clipboard.writeText(result.address)}
                className="font-cinzel text-xs tracking-wider uppercase px-3 py-2 border border-gold/20 text-marble-muted hover:border-gold/50 hover:text-gold transition-colors"
              >
                Copy
              </button>
              <a
                href={`${ETHERSCAN_BASE}/address/${result.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-cinzel text-xs tracking-wider uppercase px-3 py-2 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors whitespace-nowrap"
              >
                Arbiscan ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {result.revoked && (
        <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 border-l-4 border-red-800 bg-red-950/30 px-5 py-3">
          <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Verification Revoked</p>
          <p className="font-cormorant text-red-300 italic text-base">
            This seal has been revoked and should not be trusted for protocol access.
          </p>
        </div>
      )}

      {result.burnPending && (
        <div className="mx-5 mb-5 sm:mx-8 sm:mb-6 border-l-4 border-gold/50 bg-gold/5 px-5 py-3">
          <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-1">Burn Pending</p>
          <p className="font-cormorant text-gold/70 italic text-base">
            The owner has requested deletion of this seal. After the 90-day delay, it will be permanently removed.
          </p>
        </div>
      )}

      {/* Footer links */}
      <div className="px-5 pb-6 sm:px-8 sm:pb-8 pt-2 border-t border-gold/10 flex gap-6 justify-center">
        <a
          href={`${ETHERSCAN_BASE}/address/${CONTRACT_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors"
        >
          View Contract
        </a>
        <span className="text-gold/20">•</span>
        <a
          href={`${ETHERSCAN_BASE}/address/${result.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors"
        >
          View Address
        </a>
      </div>

    </div>
  );
}
