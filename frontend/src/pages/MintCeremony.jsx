import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TIERS } from '../utils/constants';
import { CONTRACT_ADDRESS } from '../utils/contract';

const tierTextClass = {
  orange: 'text-gold',
  gray:   'text-marble-dim',
  yellow: 'text-gold',
  blue:   'text-blue-300',
  purple: 'text-purple-300',
};


export function MintCeremony() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const tier   = state?.tier;
  const sealId = state?.sealId;

  // If arrived without state (e.g. direct nav), send to status
  useEffect(() => {
    if (!tier || !sealId) navigate('/demo/status', { replace: true });
  }, [tier, sealId, navigate]);

  // After 1 second, prompt the user to add the NFT to MetaMask
  useEffect(() => {
    if (!tier || !sealId) return;

    const t = setTimeout(async () => {
      if (!window.ethereum) return;
      try {
        await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC721',
            options: {
              address: CONTRACT_ADDRESS,
              tokenId: sealId.toString(),
            },
          },
        });
      } catch {
        // User dismissed or MetaMask doesn't support it — silently ignore
      }
    }, 1000);

    return () => clearTimeout(t);
  }, [tier, sealId]);

  if (!tier || !sealId) return null;

  const tierInfo   = TIERS[tier] ?? TIERS[1];
  const colorKey   = tierInfo.color;
  const textClass = tierTextClass[colorKey];

  return (
    <div className="min-h-screen bg-tyrian-deep flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">

        {/* Top ornament */}
        <div className="flex items-center justify-center gap-4 -mb-56 opacity-50">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold"></div>
          <div className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0"></div>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold"></div>
        </div>

        {/* Seal image */}
        <div className="flex justify-center -mb-56">
          <img
            src={`/tiers/tier-${tier}.png`}
            alt={`${tierInfo.name} seal`}
            className="w-[56rem] h-[56rem] max-w-none object-contain"
          />
        </div>

        {/* Tier badge */}
        <div className="flex justify-center mb-3">
          <span className={`font-cinzel text-xs tracking-[0.3em] uppercase px-4 py-1.5 border border-gold/40 ${textClass}`}>
            Tier {tierInfo.numeral} &mdash; {tierInfo.name}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-3">
          Your pact has been sealed.
        </h1>

        {/* Subtext */}
        <p className="font-cormorant text-marble-muted italic text-xl leading-relaxed mb-6">
          Your Covenant seal has been permanently bound to your wallet.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/demo/status')}
          className="font-cinzel text-xs tracking-widest uppercase px-8 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
        >
          View My Seal
        </button>

        {/* Seal ID */}
        <p className="font-mono text-marble-muted/40 text-xs mt-4">
          Seal #{sealId}
        </p>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-4 mt-6 opacity-50">
          <div className="h-px w-24 bg-gradient-to-r from-transparent to-gold"></div>
          <div className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0"></div>
          <div className="h-px w-24 bg-gradient-to-l from-transparent to-gold"></div>
        </div>

      </div>
    </div>
  );
}
