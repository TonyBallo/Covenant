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

const tierBadgeClass = {
  orange: 'bg-tyrian-mid border-gold text-gold',
  gray:   'bg-tyrian-dark border-marble-muted text-marble-dim',
  yellow: 'bg-tyrian-mid border-gold text-gold',
  blue:   'bg-tyrian-dark border-blue-700 text-blue-300',
  purple: 'bg-tyrian-dark border-purple-700 text-purple-300',
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

      <div className="p-5 sm:p-8">

        {/* Tier display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gold/15">
          <div className={`font-cinzel text-5xl sm:text-7xl font-bold leading-none ${tierTextClass[tierInfo.color]}`}>
            {tierInfo.numeral}
          </div>
          <div className="flex-1">
            <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">Verification Tier</p>
            <p className={`font-cinzel text-2xl sm:text-3xl tracking-wide mb-2 ${tierTextClass[tierInfo.color]}`}>
              {tierInfo.name}
            </p>
            <p className="font-cormorant text-marble-muted italic text-lg">{tierInfo.description}</p>
          </div>
          <div className={`hidden sm:block border px-5 py-3 text-center ${tierBadgeClass[tierInfo.color]}`}>
            <p className="font-cinzel text-xs tracking-widest uppercase mb-1">Tier</p>
            <p className="font-cinzel text-2xl font-bold">{tierInfo.numeral}</p>
          </div>
        </div>

        {/* Data grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Seal ID',     value: `#${result.sealId}`, mono: true },
            { label: 'Issued',      value: mintDate },
            { label: 'Status',      value: result.revoked ? 'Revoked' : 'Active',
              valueClass: result.revoked ? 'text-red-400' : 'text-gold' },
            { label: 'Burn Status', value: result.burnPending ? 'Pending' : 'None',
              valueClass: result.burnPending ? 'text-gold/70' : 'text-marble-muted' },
          ].map(({ label, value, mono, valueClass }) => (
            <div key={label} className="border border-gold/10 bg-tyrian-dark px-5 py-4">
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">{label}</p>
              <p className={`text-lg font-semibold ${mono ? 'font-mono' : 'font-cormorant'} ${valueClass || 'text-marble'}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Wallet address */}
        <div className="border border-gold/10 bg-tyrian-dark px-5 py-4 mb-6">
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

        {/* Warnings */}
        {result.revoked && (
          <div className="border-l-4 border-red-800 bg-red-950/30 px-6 py-4 mb-4">
            <p className="font-cinzel text-red-400 text-xs tracking-widest uppercase mb-1">Verification Revoked</p>
            <p className="font-cormorant text-red-300 italic text-lg">
              This seal has been revoked and should not be trusted for protocol access.
            </p>
          </div>
        )}

        {result.burnPending && (
          <div className="border-l-4 border-gold/50 bg-gold/5 px-6 py-4 mb-4">
            <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-1">Burn Pending</p>
            <p className="font-cormorant text-gold/70 italic text-lg">
              The owner has requested deletion of this seal. After the 90-day delay, it will be permanently removed.
            </p>
          </div>
        )}

        {/* Footer links */}
        <div className="pt-6 border-t border-gold/10 flex gap-6 justify-center">
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
    </div>
  );
}
