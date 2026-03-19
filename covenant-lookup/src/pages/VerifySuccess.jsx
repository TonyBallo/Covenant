import { Link } from 'react-router-dom';

export function VerifySuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full border border-gold/30 bg-tyrian-darker p-10 text-center">

        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-10 bg-gradient-to-r from-transparent to-gold/40"></div>
          <div className="w-1.5 h-1.5 bg-gold rotate-45"></div>
          <div className="h-px w-10 bg-gradient-to-l from-transparent to-gold/40"></div>
        </div>

        <h2 className="font-cinzel text-marble text-2xl tracking-wide mb-4">
          Email Verified
        </h2>
        <p className="font-cormorant text-marble-dim italic text-xl leading-relaxed mb-3">
          Your application has been submitted and is now under review.
        </p>
        <p className="font-cormorant text-marble-muted italic text-base mb-10">
          This typically takes 1–2 business days.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/status"
            className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 bg-gold text-tyrian-deep hover:bg-gold-dim transition-colors"
          >
            Check Application Status
          </Link>
          <Link
            to="/"
            className="font-cinzel text-xs tracking-widest uppercase px-6 py-3 border border-gold/30 text-gold/70 hover:border-gold/60 hover:text-gold transition-colors"
          >
            Return Home
          </Link>
        </div>

      </div>
    </div>
  );
}
