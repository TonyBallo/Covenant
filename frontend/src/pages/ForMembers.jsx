import { useNavigate } from 'react-router-dom';

const SCENARIOS = [
  {
    numeral: 'I',
    label: 'The Cost of Compliance',
    body: [
      "You want to use a new online platform. You've already verified with two others this year — uploaded the same documents, waited the same waiting periods. You do it again. Six months later, one of those platforms gets breached. Your passport scan was in there.",
      "Your data was taken. And there was nothing you could have done to prevent it — you had no choice but to hand it over.",
    ],
  },
  {
    numeral: 'II',
    label: 'The Cost of Trusting the Wrong Person',
    body: [
      "Someone reaches out. They're knowledgeable, credible, and the opportunity sounds real — a private investment, an early deal, a way to grow your money. You send the funds. They disappear.",
      "The wallet they used had been linked to the same scheme dozens of times across different victims. The only way you could have known was to run a full blockchain trace — something that takes hours and expertise most people don't have.",
    ],
  },
];

export function ForMembers() {
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
          <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">For Members</p>
          <h1 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-5 leading-snug">
            The costs of the digital world
          </h1>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed">
            Not rare events. Not worst-case scenarios. These happen every day — because the internet
            was never built with a shared layer of trust between people.
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
            A Covenant seal changes both.
          </h2>
          <p className="font-cormorant text-marble-dim italic text-lg md:text-xl leading-relaxed mb-4">
            When a wallet holds a Covenant seal, you know a real, verified person stands behind it —
            someone who entered a pact to remain trustworthy, and whose standing you can check
            instantly, without a trace.
          </p>
          <p className="font-cormorant text-marble-dim italic text-lg md:text-xl leading-relaxed">
            And once you have one yourself, you never prove who you are again. Your information stays
            with us. What travels is your reputation.
          </p>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/demo/member-demo')}
            className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim transition-colors"
          >
            See it in action →
          </button>
          <button
            onClick={() => navigate('/demo/get-verified')}
            className="w-full font-cinzel text-xs tracking-widest uppercase py-4 border border-gold/30 text-gold hover:bg-gold/5 hover:border-gold/60 transition-colors"
          >
            Apply for your seal
          </button>
        </div>

        <p className="font-cormorant text-marble-muted/40 italic text-sm text-center mt-6">
          This is a testnet demo. No real personal data is processed.
        </p>

      </div>
    </div>
  );
}
