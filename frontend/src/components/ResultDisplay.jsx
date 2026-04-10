import { TIERS, formatDate } from '../utils/constants';
import { ETHERSCAN_BASE, CONTRACT_ADDRESS } from '../utils/contract';
import { getCrossChainStatus } from '../utils/api';
import { useState, useEffect } from 'react';

const TIER_BLURB = {
  1: 'This wallet belongs to a verified unique human. Trusted for governance, airdrops, and community access.',
  2: 'This wallet is linked to a confirmed legal identity. Trusted for light-compliance DeFi, DAO interactions, and identity-gated applications.',
  3: 'This wallet has passed enhanced due diligence including liveness, sanctions screening, and source of funds review. Trusted for regulated DeFi and MiCA-exposed platforms.',
  4: 'This wallet belongs to a verified, sophisticated investor. Trusted for RWA platforms, security token offerings, and investor-gated participation.',
  5: 'This wallet is linked to a verified legal entity with transparent ownership and a certified AML program. Trusted for institutional counterparty and corporate treasury interactions.',
};

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
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(result.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          No Trust Seal Found
        </h3>
        <p className="font-cormorant text-marble-muted italic text-lg mb-6">
          This wallet has not completed Covenant verification. No trust standing has been established.
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
      <div className="bg-tyrian-dark border-b border-gold/20 px-5 py-4 sm:px-8 sm:py-5 relative">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Trust Seal</p>
            <button
              onClick={copyAddress}
              className="font-mono text-sm text-marble hover:text-gold transition-colors"
              title="Click to copy full address"
            >
              {result.address.slice(0, 6)}…{result.address.slice(-4)}
            </button>
            {copied && (
              <p className="font-cinzel text-gold/70 text-xs tracking-widest uppercase mt-1">Copied ✓</p>
            )}
          </div>
          <div className="flex items-center gap-3 absolute right-5 sm:right-8">
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
      {result.tier >= 1 && (
        <img
          src={`/tiers/tier-${result.tier}.png`}
          alt={`Tier ${result.tier} seal`}
          className="w-full h-auto block border-b border-gold/10"
        />
      )}

      {/* Tier row */}
      <div className={`px-5 py-5 sm:px-8 sm:py-6 border-b border-gold/15 flex items-center gap-4 sm:gap-6 ${result.revoked ? 'bg-red-950/20' : ''}`}>
        <div className={`font-cinzel text-5xl sm:text-6xl font-bold leading-none ${tierTextClass[tierInfo.color]}`}>
          {tierInfo.numeral}
        </div>
        <div>
          <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Trust Tier</p>
          <p className={`font-cinzel text-xl sm:text-2xl tracking-wide ${tierTextClass[tierInfo.color]}`}>
            {tierInfo.name}
          </p>
        </div>
      </div>

      {/* Tier blurb */}
      <div className="px-5 pt-5 sm:px-8 sm:pt-6">
        {result.revoked ? (
          <p className="font-cormorant text-red-300/80 italic text-lg leading-relaxed">
            This wallet's Covenant seal has been revoked. Trust standing is no longer valid. Do not rely on this wallet for compliance-sensitive interactions.
          </p>
        ) : (
          <p className="font-cormorant text-marble-muted italic text-lg leading-relaxed">
            {TIER_BLURB[result.tier]}
          </p>
        )}
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
          <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Trust Seal Revoked</p>
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
