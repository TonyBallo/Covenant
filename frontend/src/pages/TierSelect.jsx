import { Link, useLocation } from 'react-router-dom';
import { TIERS } from '../utils/constants';

const TIER_STYLES = {
  1: { border: 'border-gold/50',       badge: 'border-gold/40 text-gold bg-gold/10',             available: true  },
  2: { border: 'border-gold/10',       badge: 'border-marble-muted/20 text-marble-muted bg-tyrian-dark', available: false },
  3: { border: 'border-gold/10',       badge: 'border-gold/20 text-gold/50 bg-tyrian-dark',      available: false },
  4: { border: 'border-blue-900/40',   badge: 'border-blue-900/30 text-blue-400/50 bg-tyrian-dark', available: false },
  5: { border: 'border-purple-900/40', badge: 'border-purple-900/30 text-purple-400/50 bg-tyrian-dark', available: false },
};

export function TierSelect() {
  const location = useLocation();
  const upgradeMode = location.state?.upgrade === true;
  const currentTier = location.state?.currentTier ?? 0;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-12">
          <Link to="/demo" className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors mb-6 inline-block">
            ← Return
          </Link>
          <h1 className="font-cinzel text-marble text-4xl tracking-wide mb-3">
            {upgradeMode ? 'Upgrade Your Seal' : 'Build Your Trust'}
          </h1>
          <p className="font-cormorant text-marble-muted italic text-xl">
            {upgradeMode
              ? `You currently hold Tier ${currentTier}. Select the tier you wish to upgrade to.`
              : 'Select the trust tier that matches your needs'}
          </p>
          {!upgradeMode && (
            <Link
              to="/demo/get-verified/apply"
              state={{ tierRequested: 1, isUpgrade: false }}
              className="inline-block mt-8 font-cinzel text-xs tracking-widest uppercase px-10 py-4 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
            >
              Begin with Tier I — Bronze
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((tierNum) => {
            const tier = TIERS[tierNum];
            const styles = TIER_STYLES[tierNum];
            const isCurrent = upgradeMode && tierNum === currentTier;
            const isBelowCurrent = upgradeMode && tierNum < currentTier;
            const isEligible = styles.available && (!upgradeMode || tierNum > currentTier);

            return (
              <div
                key={tierNum}
                className={`border bg-tyrian-darker px-6 py-5 transition-colors ${styles.border} ${
                  isEligible ? 'hover:bg-tyrian-dark' : 'opacity-50'
                }`}
              >
                {isCurrent && (
                  <span className="float-right font-cinzel text-xs tracking-widest text-gold uppercase">
                    Current Tier
                  </span>
                )}
                {!isCurrent && !styles.available && (
                  <span className="float-right font-cinzel text-xs tracking-widest text-marble-muted uppercase">
                    Coming Soon
                  </span>
                )}
                {isBelowCurrent && (
                  <span className="float-right font-cinzel text-xs tracking-widest text-marble-muted/50 uppercase">
                    Already Surpassed
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className={`w-11 h-11 border flex items-center justify-center font-cinzel font-bold text-sm ${styles.badge}`}>
                      {tier.numeral}
                    </div>
                    <div>
                      <h3 className="font-cinzel text-marble text-sm tracking-wide">
                        Tier {tierNum} — {tier.name}
                      </h3>
                      <p className="font-cormorant text-marble-muted italic text-base mt-0.5">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  {isEligible ? (
                    <Link
                      to="/demo/get-verified/apply"
                      state={{ tierRequested: tierNum, isUpgrade: upgradeMode, currentTier }}
                      className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors shrink-0"
                    >
                      {upgradeMode ? 'Select' : 'Apply'}
                    </Link>
                  ) : (
                    <span className="font-cinzel text-marble-muted/40 text-xs tracking-widest uppercase shrink-0">
                      {isCurrent || isBelowCurrent ? '' : 'Unavailable'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="font-cormorant text-marble-muted/50 italic text-sm text-center mt-8">
          Higher tiers require additional documentation and review time.
        </p>

      </div>
    </div>
  );
}
