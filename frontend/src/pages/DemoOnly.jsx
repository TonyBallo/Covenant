import { useNavigate } from 'react-router-dom';

export function DemoOnly() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="font-cinzel text-marble-muted/40 hover:text-marble-muted text-xs tracking-widest uppercase transition-colors mb-12 inline-block"
        >
          ← Back
        </button>

        <div className="flex items-center gap-4 mb-10 opacity-40">
          <div className="h-px flex-1 bg-gradient-to-r from-gold-dim to-transparent" />
          <div className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
          <div className="h-px flex-1 bg-gradient-to-l from-gold-dim to-transparent" />
        </div>

        <div className="mb-10">
          <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">Demo Environment</p>
          <h1 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-5 leading-snug">
            Applications aren't open yet.
          </h1>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed mb-4">
            Covenant is currently running on testnet. What you've seen is a live demo — real contracts,
            real on-chain verification — but we're not yet accepting applications from the public.
          </p>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
            When we launch on mainnet, verified membership will be open. Join the waitlist and
            you'll be among the first to know.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-10 opacity-40">
          <div className="h-px flex-1 bg-gradient-to-r from-gold-dim to-transparent" />
          <div className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
          <div className="h-px flex-1 bg-gradient-to-l from-gold-dim to-transparent" />
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/waitlist')}
            className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
          >
            Join the waitlist
          </button>
          <button
            onClick={() => navigate('/demo')}
            className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-colors"
          >
            Explore the lookup tool
          </button>
        </div>

        <p className="font-cormorant text-marble-muted/40 italic text-sm text-center mt-6">
          This is a testnet demo. No real personal data is processed.
        </p>

      </div>
    </div>
  );
}
