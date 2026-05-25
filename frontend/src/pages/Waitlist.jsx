import { useState } from 'react';
import { Link } from 'react-router-dom';
import { joinWaitlist } from '../utils/api';

export function Waitlist() {
  const [userType, setUserType] = useState('individual');
  const [formData, setFormData] = useState({ name: '', email: '', org_name: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await joinWaitlist({
        name: formData.name,
        email: formData.email,
        user_type: userType,
        org_name: userType === 'protocol' ? formData.org_name : undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-lg mx-auto">

        {/* Header ornament */}
        <div className="flex items-center justify-center gap-4 mb-8 opacity-60">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-dim" />
          <div className="w-1.5 h-1.5 bg-gold rotate-45" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-dim" />
        </div>

        <div className="text-center mb-10">
          <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-4">Mainnet Launch</p>
          <h1 className="font-cinzel text-marble text-3xl tracking-wide mb-4">Join the Waitlist</h1>
          <p className="font-cormorant text-marble-dim text-lg italic leading-relaxed">
            Covenant is currently running on testnet. Be first to know when we launch on mainnet.
          </p>
        </div>

        {success ? (
          <div className="border border-gold/30 bg-gold/5 px-8 py-10 text-center">
            <div className="flex items-center justify-center gap-4 mb-6 opacity-50">
              <div className="h-px w-12 bg-gold-dim" />
              <div className="w-1.5 h-1.5 bg-gold rotate-45" />
              <div className="h-px w-12 bg-gold-dim" />
            </div>
            <p className="font-cinzel text-gold text-xs tracking-[0.3em] uppercase mb-3">You're on the list</p>
            <p className="font-cormorant text-marble text-xl italic mb-6">
              We'll reach out when Covenant goes live on mainnet.
            </p>
            <Link
              to="/demo"
              className="font-cinzel text-marble-muted hover:text-gold text-xs tracking-widest uppercase transition-colors"
            >
              ← Back to demo
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-gold/20 bg-tyrian-darker p-8 space-y-6">

            {/* User type toggle */}
            <div>
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-3">I am a</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'individual', label: 'Individual User' },
                  { value: 'protocol',   label: 'Protocol / Vendor' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setUserType(value)}
                    className={`py-3 px-4 font-cinzel text-xs tracking-widest uppercase border transition-colors ${
                      userType === value
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-gold/20 text-marble-muted hover:border-gold/40 hover:text-marble'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/40 focus:outline-none focus:border-gold/70 font-cormorant text-base transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/40 focus:outline-none focus:border-gold/70 font-cormorant text-base transition-colors"
              />
            </div>

            {/* Org name (protocol only) */}
            {userType === 'protocol' && (
              <div>
                <label className="font-cinzel text-marble-muted text-xs tracking-widest uppercase block mb-2">
                  Project / Organisation
                </label>
                <input
                  type="text"
                  name="org_name"
                  value={formData.org_name}
                  onChange={handleChange}
                  placeholder="Protocol name or organisation"
                  className="w-full px-4 py-3 bg-tyrian-dark border border-gold/30 text-marble placeholder-marble-muted/40 focus:outline-none focus:border-gold/70 font-cormorant text-base transition-colors"
                />
              </div>
            )}

            {error && (
              <div className="border-l-4 border-red-800 bg-red-950/30 px-5 py-3">
                <p className="font-cormorant text-red-300 italic text-base">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-cinzel text-xs tracking-widest uppercase py-4 bg-gold text-tyrian-deep font-semibold hover:bg-gold-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting…' : 'Join Waitlist'}
            </button>

            <p className="font-cormorant text-marble-muted/50 italic text-sm text-center">
              No spam. We'll only contact you about the mainnet launch.
            </p>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/demo"
            className="font-cinzel text-marble-muted/50 hover:text-marble-muted text-xs tracking-widest uppercase transition-colors"
          >
            ← Explore the demo
          </Link>
        </div>

      </div>
    </div>
  );
}
