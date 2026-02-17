import { Link } from 'react-router-dom';
import { TIERS } from '../utils/constants';

const TIER_STYLES = {
  1: { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800', button: 'bg-orange-500 hover:bg-orange-600 text-white' },
  2: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-500', button: '' },
  3: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', button: '' },
  4: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', button: '' },
  5: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', button: '' },
};

export function TierSelect() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="text-sm text-covenant-purple hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Get Verified</h1>
          <p className="text-gray-600">
            Select the verification tier that matches your needs
          </p>
        </div>

        {/* Tier Cards */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((tierNum) => {
            const tier = TIERS[tierNum];
            const styles = TIER_STYLES[tierNum];
            const isAvailable = tierNum === 1;

            return (
              <div
                key={tierNum}
                className={`
                  relative rounded-lg border-2 p-6 transition-all
                  ${styles.bg} ${styles.border}
                  ${isAvailable ? 'shadow-md hover:shadow-lg' : 'opacity-60'}
                `}
              >
                {/* Coming Soon Badge */}
                {!isAvailable && (
                  <span className={`absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded-full ${styles.badge}`}>
                    Coming Soon
                  </span>
                )}

                <div className="flex items-center justify-between">
                  {/* Left: Tier info */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${styles.badge}`}>
                      {tier.numeral}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        Tier {tierNum} — {tier.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{tier.description}</p>
                    </div>
                  </div>

                  {/* Right: Action */}
                  {isAvailable ? (
                    <Link
                      to="/get-verified/apply"
                      className={`px-5 py-2 rounded-lg font-semibold text-sm transition ${styles.button}`}
                    >
                      Apply →
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm font-medium">Unavailable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-8">
          Higher tiers require additional documentation and review time.
        </p>
      </div>
    </div>
  );
}
