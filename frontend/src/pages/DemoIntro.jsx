import { useNavigate } from 'react-router-dom';

export function DemoIntro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center py-16 px-6">
      <div className="max-w-4xl mx-auto w-full">

        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-8 opacity-50">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim" />
            <div className="w-1.5 h-1.5 bg-gold rotate-45" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim" />
          </div>
          <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-5">Welcome to Covenant</p>
          <h1 className="font-cinzel text-marble text-3xl md:text-4xl tracking-wide mb-5">
            Who are you here as?
          </h1>
          <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed max-w-lg mx-auto">
            Choose your path. We'll show you exactly what Covenant is built to solve for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Member path */}
          <button
            onClick={() => navigate('/demo/for-members')}
            className="group text-left border border-gold/20 bg-tyrian-darker hover:border-gold/50 hover:bg-gold/5 p-8 md:p-10 transition-all duration-300"
          >
            <p className="font-cinzel text-gold/40 text-xs tracking-[0.3em] uppercase mb-5 group-hover:text-gold/60 transition-colors">
              Path I
            </p>
            <h2 className="font-cinzel text-marble text-xl tracking-wide mb-4 leading-snug">
              I'm looking to get verified
            </h2>
            <p className="font-cormorant text-marble-muted italic text-lg leading-relaxed">
              You want to establish your reputation once and carry it across every platform you use.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="font-cinzel text-gold/40 text-xs tracking-widest uppercase group-hover:text-gold/70 transition-colors">
                Continue
              </span>
              <svg className="w-3 h-3 text-gold/40 group-hover:text-gold/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </button>

          {/* Protocol path */}
          <button
            onClick={() => navigate('/demo/for-protocols')}
            className="group text-left border border-gold/20 bg-tyrian-darker hover:border-gold/50 hover:bg-gold/5 p-8 md:p-10 transition-all duration-300"
          >
            <p className="font-cinzel text-gold/40 text-xs tracking-[0.3em] uppercase mb-5 group-hover:text-gold/60 transition-colors">
              Path II
            </p>
            <h2 className="font-cinzel text-marble text-xl tracking-wide mb-4 leading-snug">
              I'm building a protocol
            </h2>
            <p className="font-cormorant text-marble-muted italic text-lg leading-relaxed">
              You need to know your users are who they say they are — without building the infrastructure to verify them yourself.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="font-cinzel text-gold/40 text-xs tracking-widest uppercase group-hover:text-gold/70 transition-colors">
                Continue
              </span>
              <svg className="w-3 h-3 text-gold/40 group-hover:text-gold/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </button>

        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/demo')}
            className="font-cormorant text-marble-muted/35 hover:text-marble-muted/60 italic text-base transition-colors"
          >
            Skip to member lookup →
          </button>
        </div>

      </div>
    </div>
  );
}
