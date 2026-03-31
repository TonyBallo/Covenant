import { Link } from 'react-router-dom';
import { TIERS } from '../utils/constants';

const TIER_STYLES = {
  1: { border: 'border-gold/50',    badge: 'border-gold/40 text-gold bg-gold/10',    available: true  },
  2: { border: 'border-gold/10',    badge: 'border-marble-muted/20 text-marble-muted bg-tyrian-dark', available: false },
  3: { border: 'border-gold/10',    badge: 'border-gold/20 text-gold/50 bg-tyrian-dark', available: false },
  4: { border: 'border-blue-900/40', badge: 'border-blue-900/30 text-blue-400/50 bg-tyrian-dark', available: false },
  5: { border: 'border-purple-900/40', badge: 'border-purple-900/30 text-purple-400/50 bg-tyrian-dark', available: false },
};

export function TierSelect() {
  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-12">
          <Link to="/demo" className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors mb-6 inline-block">
            ← Return
          </Link>
          <h1 className="font-cinzel text-marble text-4xl tracking-wide mb-3">Build Your Trust</h1>
          <p className="font-cormorant text-marble-muted italic text-xl">
            Select the trust tier that matches your needs
          </p>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((tierNum) => {
            const tier = TIERS[tierNum];
            const styles = TIER_STYLES[tierNum];

            return (
              <div
                key={tierNum}
                className={`border bg-tyrian-darker px-6 py-5 transition-colors ${styles.border} ${
                  styles.available ? 'hover:bg-tyrian-dark' : 'opacity-50'
                }`}
              >
                {!styles.available && (
                  <span className="float-right font-cinzel text-xs tracking-widest text-marble-muted uppercase">
                    Coming Soon
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
                  {styles.available ? (
                    <Link
                      to="/demo/get-verified/apply"
                      className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors shrink-0"
                    >
                      Apply
                    </Link>
                  ) : (
                    <span className="font-cinzel text-marble-muted/40 text-xs tracking-widest uppercase shrink-0">
                      Unavailable
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
