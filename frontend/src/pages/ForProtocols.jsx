import { useNavigate } from 'react-router-dom';

const SCENARIOS = [
  {
    numeral: 'I',
    label: 'The Compliance Stack Becomes the Liability',
    body: [
      "Your protocol requires basic compliance. You build the KYC stack, collect documents, store them. You get breached. Now you're dealing with the attack and regulatory penalties for holding data your users never wanted you to have in the first place.",
      "The infrastructure you built to protect your platform has become its greatest vulnerability. You were punished for holding data nobody asked you to keep.",
    ],
  },
  {
    numeral: 'II',
    label: 'You Didn\'t Know Who Was in Your Platform',
    body: [
      "Law enforcement shows up at your office. Your platform has been used to move funds for a human trafficking network. You had no idea — your users were anonymous.",
      "Now you're paying legal fees, cooperating with a federal investigation, and watching your reputation collapse in public. You weren't complicit. But you didn't know who your users were, and in the eyes of the law, that is not a sufficient defense.",
    ],
  },
];

export function ForProtocols() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate('/demo/intro')}
          className="font-cinzel text-marble-muted/40 hover:text-marble-muted text-xs tracking-widest uppercase transition-colors mb-12 inline-block"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="mb-12">
          <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">For Protocols</p>
          <h1 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-5 leading-snug">
            Not knowing your users<br className="hidden sm:block" /> is not a defense.
          </h1>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
            Platforms and services face the broken identity system from the other side. The liability
            is real, and it doesn't require malicious intent to land on your doorstep.
          </p>
        </div>

        {/* Scenarios */}
        <div className="space-y-8 mb-14">
          {SCENARIOS.map(({ numeral, label, body }) => (
            <div key={numeral} className="border-l-2 border-gold/25 pl-7">
              <div className="flex items-center gap-3 mb-4">
                <span className="font-cinzel text-gold/35 text-xs tracking-widest">{numeral}</span>
                <span className="font-cinzel text-marble-muted text-xs tracking-widest uppercase">{label}</span>
              </div>
              {body.map((para, i) => (
                <p key={i} className="font-cormorant text-marble-dim italic text-lg md:text-xl leading-relaxed mb-3 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12 opacity-40">
          <div className="h-px flex-1 bg-gradient-to-r from-gold-dim to-transparent" />
          <div className="w-1.5 h-1.5 bg-gold rotate-45 shrink-0" />
          <div className="h-px flex-1 bg-gradient-to-l from-gold-dim to-transparent" />
        </div>

        {/* Resolution */}
        <div className="mb-12">
          <h2 className="font-cinzel text-marble text-xl md:text-2xl tracking-wide mb-5 leading-snug">
            One read call. No data to store.<br className="hidden sm:block" /> No liability to absorb.
          </h2>
          <p className="font-cormorant text-marble-dim italic text-lg md:text-xl leading-relaxed mb-4">
            Covenant members have already been vetted. Your protocol calls{' '}
            <span className="font-mono text-gold not-italic text-base">isValid(address, minTier)</span>{' '}
            and receives a boolean. If it's true, a real, verified person stands behind that wallet —
            and you never touched their data to find out.
          </p>
          <p className="font-cormorant text-marble-dim italic text-lg md:text-xl leading-relaxed">
            The compliance coverage is built in. The liability is gone.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/demo/vendor-demo')}
            className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
          >
            See the integration demo
          </button>
          <button
            onClick={() => navigate('/waitlist')}
            className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-colors"
          >
            Join the waitlist
          </button>
        </div>

        <p className="font-cormorant text-marble-muted/40 italic text-sm text-center mt-6">
          This is a testnet demo. Integration documentation is available in the Docs.
        </p>

      </div>
    </div>
  );
}
