import { useSearchParams, Link } from 'react-router-dom';

const STATES = {
  ok: {
    label: "You're confirmed.",
    body: "Your spot on the Covenant waitlist is secured. We'll be in touch when we launch on mainnet.",
    gold: true,
  },
  expired: {
    label: 'This link has expired.',
    body: 'Confirmation links are valid for 24 hours. Return to the waitlist page and sign up again — it only takes a moment.',
    gold: false,
  },
  invalid: {
    label: 'Invalid confirmation link.',
    body: "We couldn't find a matching signup. If you believe this is an error, please sign up again.",
    gold: false,
  },
  error: {
    label: 'Something went wrong.',
    body: 'Please try signing up again. If the problem persists, reach out to us directly.',
    gold: false,
  },
};

export function WaitlistConfirmed() {
  const [params] = useSearchParams();
  const status = params.get('status') ?? 'ok';
  const state = STATES[status] ?? STATES.error;

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-center gap-4 mb-10 opacity-60">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim" />
          <div className="w-1.5 h-1.5 bg-gold rotate-45" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim" />
        </div>

        <div className={`border px-8 py-12 text-center ${state.gold ? 'border-gold/30 bg-gold/5' : 'border-gold/15 bg-tyrian-darker'}`}>
          <p className={`font-cinzel text-xs tracking-[0.3em] uppercase mb-4 ${state.gold ? 'text-gold' : 'text-marble-muted/60'}`}>
            Covenant Protocol
          </p>
          <h1 className="font-cinzel text-marble text-2xl md:text-3xl tracking-wide mb-5 leading-snug">
            {state.label}
          </h1>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed mb-8">
            {state.body}
          </p>
          <div className="space-y-3">
            {!state.gold && (
              <Link
                to="/waitlist"
                className="block w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
              >
                Back to waitlist
              </Link>
            )}
            <Link
              to="/demo/intro"
              className="block font-cinzel text-marble-muted/50 hover:text-marble-muted text-xs tracking-widest uppercase transition-colors"
            >
              ← Explore the demo
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
