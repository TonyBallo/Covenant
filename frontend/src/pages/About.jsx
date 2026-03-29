import { Link, useNavigate } from 'react-router-dom';

const PRINCIPLES = [
  {
    title: 'Compliance without compromise.',
    body: 'Covenant is verification infrastructure, not surveillance infrastructure. We verify who you are — we don\'t watch what you do. Your data stays with us. Your reputation travels everywhere.',
  },
  {
    title: 'Status without stakes isn\'t status.',
    body: 'A Covenant seal is not a checkbox. It is a commitment. The pact you enter into with Covenant is an agreement to remain trustworthy — and that agreement has real enforcement behind it.',
  },
  {
    title: 'Built for the long game.',
    body: 'Every significant compliance moat in financial services was built through operational history, not clever code. We\'re building Covenant to be the infrastructure that institutional DeFi runs on — and that takes time, trust, and discipline to get right.',
  },
];

function SectionLabel({ children }) {
  return (
    <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-6">{children}</p>
  );
}

function Ornament() {
  return (
    <div className="flex items-center justify-center gap-4 opacity-50 my-8">
      <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim" />
      <div className="w-1.5 h-1.5 bg-gold rotate-45" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim" />
    </div>
  );
}

export function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-tyrian-deeper">

      {/* Minimal header */}
      <header className="border-b border-gold/15 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4">
            <div className="w-9 h-9 border border-gold/50 flex items-center justify-center">
              <span className="font-cinzel text-gold font-semibold text-lg leading-none">C</span>
            </div>
            <div>
              <h1 className="font-cinzel text-marble tracking-[0.2em] uppercase text-base leading-tight">Covenant</h1>
              <p className="font-cormorant text-marble-muted italic text-xs tracking-wider leading-tight">Web3 Identity Verification</p>
            </div>
          </Link>
          <button
            onClick={() => navigate('/demo')}
            className="font-cinzel text-xs tracking-widest uppercase px-5 py-2 border border-gold/60 text-gold hover:bg-gold/10 transition-colors"
          >
            Launch App
          </button>
        </div>
      </header>

      {/* ── Section 1: Hero ── */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <Ornament />
          <h1 className="font-cinzel text-marble text-4xl md:text-5xl lg:text-6xl tracking-wide leading-tight mb-8">
            Trust doesn't happen by accident.
            <br className="hidden sm:block" /> It gets built.
          </h1>
          <div className="w-px h-8 bg-gradient-to-b from-gold/40 to-transparent mx-auto mb-8" />
          <p className="font-cormorant text-marble-muted italic text-xl md:text-2xl leading-relaxed">
            Covenant exists because the systems people rely on never made trust legible.
            We're changing that.
          </p>
          <Ornament />
        </div>
      </section>

      {/* ── Section 2: Why Covenant Exists ── */}
      <section className="py-20 px-6 border-t border-gold/10">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>The Problem</SectionLabel>
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">

            {/* Pull quote */}
            <blockquote className="border-l-4 border-gold/50 pl-8">
              <p className="font-cormorant italic text-gold text-2xl md:text-3xl leading-relaxed">
                "By the time most people have interacted with enough financial services, their Social
                Security number feels like a password. That's not a user problem. That's a design
                failure."
              </p>
            </blockquote>

            {/* Body */}
            <div className="space-y-5 font-cormorant text-marble-dim text-xl leading-relaxed">
              <p>
                The financial system asks people to prove who they are constantly — to every platform,
                every service, every application that handles real money. The same documents. The same
                information. Over and over, with no memory of what came before.
              </p>
              <p>
                On the other side of that equation are the businesses holding that data. Not because
                they want to — but because compliance demands it. And when something goes wrong, they
                pay for it twice. First when the breach happens. Then when the regulators arrive.
              </p>
              <p>
                Covenant was built because both of these problems have the same root cause: there is
                no shared layer of trust in digital finance. Every participant builds their own, in
                isolation, at enormous cost to everyone involved.
              </p>
              <p className="text-marble font-semibold not-italic">That's the problem we're solving.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: The Vision ── */}
      <section className="py-24 px-6 bg-tyrian-dark border-y border-gold/15">
        <div className="max-w-3xl mx-auto text-center">
          <SectionLabel>The Vision</SectionLabel>
          <h2 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-10 leading-tight">
            A reputation you earn once.
            <br className="hidden sm:block" /> Recognized everywhere.
          </h2>
          <div className="space-y-6 font-cormorant text-marble-dim text-xl leading-relaxed text-left">
            <p>
              The most durable trust systems in history didn't work because they were technically
              sophisticated. They worked because belonging to them meant something. A credential that
              tells the world who you are — without requiring you to prove it again every time.
            </p>
            <p>
              That's what Covenant is building. The identity layer that digital finance has been
              missing. A standard that makes trust portable, compliance composable, and verification
              something worth pursuing rather than something to endure.
            </p>
            <p>
              We're starting with Web3 because that's where the gap is most visible and most costly.
              But the vision is broader. Everywhere people need to establish trust with institutions,
              Covenant should be there.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: The Founder ── */}
      <section className="py-20 px-6 border-b border-gold/10">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>The Founder</SectionLabel>
          <div className="grid md:grid-cols-[280px_1fr] gap-12 md:gap-20 items-start">

            {/* Identity block */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              {/* Photo placeholder */}
              <div className="w-40 h-40 rounded-full border-2 border-gold/30 bg-tyrian-dark flex items-center justify-center mb-6 overflow-hidden">
                <span className="font-cinzel text-gold/30 text-4xl font-bold">AC</span>
              </div>
              <h3 className="font-cinzel text-marble text-xl tracking-wide mb-2">Anthony Caraballo</h3>
              <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-4">
                Founder & CEO · TonyBallo
              </p>
              <div className="space-y-1">
                {['CISSP Certified', 'Federal Cybersecurity Professional', 'Crypto Tracing Methodology — TRM Labs'].map(c => (
                  <p key={c} className="font-cormorant text-marble-muted text-sm italic">{c}</p>
                ))}
              </div>
            </div>

            {/* Story */}
            <div className="space-y-5 font-cormorant text-marble-dim text-xl leading-relaxed">
              <p>
                My background is in federal cybersecurity — specifically in critical systems protection
                and data security. I spent years operating in environments where compliance isn't
                optional and the cost of getting it wrong is real and immediate.
              </p>
              <p>
                In that work I encountered something that stayed with me: the human cost of systems
                that don't make trust visible. People who trusted the wrong counterparty because they
                had no reliable way to know better. Businesses that held sensitive data they never
                wanted, and paid for it when things went wrong.
              </p>
              <p>
                Covenant is my answer to both of those problems. Not built from a market analysis or a
                whitepaper — built from the inside of the problem, by someone who has operated inside
                the systems that failed to solve it.
              </p>
              <p>
                The architecture, the data model, the security roadmap — they reflect a threat model
                developed in high-stakes federal environments, applied to Web3 infrastructure. The
                product reflects something simpler: a belief that trust should be legible, portable,
                and worth earning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: The Principles ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>What We Believe</SectionLabel>
          <div className="grid md:grid-cols-3 gap-6">
            {PRINCIPLES.map(({ title, body }) => (
              <div key={title} className="bg-tyrian-dark border border-gold/15 border-t-2 border-t-gold/50 p-8">
                <h3 className="font-cinzel text-gold text-sm tracking-wide mb-4 leading-snug">{title}</h3>
                <p className="font-cormorant text-marble-muted text-lg leading-relaxed italic">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Closing CTA ── */}
      <section className="py-32 px-6 text-center border-t border-gold/15">
        <div className="max-w-2xl mx-auto">
          <Ornament />
          <h2 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-6">
            Ready to build your reputation?
          </h2>
          <p className="font-cormorant text-marble-muted italic text-xl mb-12">
            Join Covenant and verify once. Your seal travels everywhere.
          </p>
          <div className="flex flex-col items-center gap-5">
            <Link
              to="/demo"
              className="font-cinzel text-xs tracking-widest uppercase px-10 py-4 border border-gold/60 text-gold hover:bg-gold hover:text-tyrian-deep transition-colors"
            >
              Launch App
            </Link>
            <Link
              to="/demo/docs"
              className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              Read the Docs →
            </Link>
          </div>
          <Ornament />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/10 py-8 px-6 text-center">
        <p className="font-cormorant text-marble-muted/50 italic text-sm">
          Covenant Protocol LLC · covenantprotocol.io
        </p>
      </footer>

    </div>
  );
}
