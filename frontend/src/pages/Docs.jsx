import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PACT_ADDRESS    = '0xBfCA5341f3c370743d4A64Df7c732113A4f83187';
const WITNESS_ADDRESS = '0x3F214e98C967e49f451c670654fA7D0580da3730';

const TOC = [
  {
    id: 'what-is-covenant',
    label: 'What is Covenant',
    children: [
      { id: 'the-problem',    label: 'The Problem We Solve' },
      { id: 'core-concepts',  label: 'Core Concepts' },
    ],
  },
  {
    id: 'how-it-works',
    label: 'How It Works',
    children: [
      { id: 'for-members',   label: 'For Members' },
      { id: 'for-protocols', label: 'For Protocols' },
    ],
  },
  {
    id: 'membership-tiers',
    label: 'Membership Tiers',
    children: [],
  },
  {
    id: 'integration-guide',
    label: 'Integration Guide',
    children: [
      { id: 'architecture',         label: 'Architecture' },
      { id: 'contract-functions',   label: 'Contract Functions' },
      { id: 'contract-addresses',   label: 'Contract Addresses' },
      { id: 'revocation-expiry',    label: 'Revocation & Expiry' },
      { id: 'tier-reference',       label: 'Tier Reference' },
      { id: 'support',              label: 'Support' },
    ],
  },
];

const ALL_IDS = TOC.flatMap(s => [s.id, ...s.children.map(c => c.id)]);

// ── Shared primitives ────────────────────────────────────────────────────────

function CodeBlock({ children }) {
  return (
    <pre className="font-mono text-xs sm:text-sm bg-tyrian-dark border border-gold/15 px-5 py-4 overflow-x-auto text-marble-dim leading-relaxed my-5 whitespace-pre">
      <code>{children}</code>
    </pre>
  );
}

function Prose({ children, className = '' }) {
  return (
    <p className={`font-cormorant text-marble-dim text-lg leading-relaxed mb-4 ${className}`}>
      {children}
    </p>
  );
}

function Label({ children }) {
  return (
    <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mt-8 mb-3">
      {children}
    </p>
  );
}

function SubHeading({ id, children }) {
  return (
    <h3
      id={id}
      className="font-cinzel text-gold text-xs tracking-widest uppercase mt-12 mb-4 scroll-mt-24 flex items-center gap-3"
    >
      <span className="w-4 h-px bg-gold/40"></span>
      {children}
    </h3>
  );
}

function Callout({ label, children }) {
  return (
    <div className="border border-gold/20 bg-gold/5 px-6 py-4 my-6">
      {label && (
        <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-2">{label}</p>
      )}
      <p className="font-cormorant text-marble-muted italic text-base leading-relaxed">{children}</p>
    </div>
  );
}

function Bullet({ items }) {
  return (
    <ul className="space-y-2 mb-5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="w-1 h-1 bg-gold/60 rounded-full shrink-0 mt-[10px]"></span>
          <span className="font-cormorant text-marble-muted italic text-lg leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionDivider({ id, children }) {
  return (
    <div
      id={id}
      className="border-b border-gold/20 mb-10 pb-3 mt-2 scroll-mt-24"
    >
      <h2 className="font-cinzel text-marble text-2xl tracking-wide">{children}</h2>
    </div>
  );
}

// ── Tier data ────────────────────────────────────────────────────────────────

const TIERS_DOC = [
  {
    numeral: 'I',
    name: 'Bronze',
    status: 'Active at launch',
    tagline: "The starting point. Prove you're real.",
    borderClass: 'border-gold/40',
    headerClass: 'bg-gold/5',
    numeralClass: 'text-gold',
    statusClass: 'text-gold/50',
    proves: "One real person controls this wallet. Bronze is Sybil resistance and bot prevention — the foundation of any trusted ecosystem. It is not a character reference, but it is the first step in building one.",
    usedFor: 'Governance platforms, airdrops, community access tools, any application that needs to know a real human is behind a wallet.',
    anchor: 'Arbitrum',
    image: '/tiers/tier-1.png',
  },
  {
    numeral: 'II',
    name: 'Silver',
    status: 'Active at launch',
    tagline: 'Prove who you are.',
    borderClass: 'border-marble-muted/20',
    headerClass: 'bg-tyrian-dark/60',
    numeralClass: 'text-marble-dim',
    statusClass: 'text-marble-muted/50',
    proves: 'A real, named person with a verifiable real-world identity stands behind this wallet. Silver confirms legal identity against government-issued documentation and is designed to align with basic KYC expectations in many FATF-member jurisdictions.',
    usedFor: 'Light-compliance DeFi, DAO treasuries, Web3 payroll platforms, smaller exchanges, any application requiring confirmed identity.',
    anchor: 'Arbitrum',
    image: '/tiers/tier-2.png',
  },
  {
    numeral: 'III',
    name: 'Gold',
    status: 'Activates in response to signed pilot demand',
    tagline: "Prove you're trustworthy by institutional standards.",
    borderClass: 'border-gold/20',
    headerClass: 'bg-gold/5',
    numeralClass: 'text-gold/60',
    statusClass: 'text-gold/40',
    proves: 'Enhanced due diligence complete. Liveness confirmed, PEP and sanctions screening passed, source of funds declared. Gold is designed to support enhanced due diligence requirements under frameworks such as EU MiCA and comparable G20 regimes.',
    usedFor: 'MiCA-exposed protocols, EU and UK regulated lending platforms, institutional DeFi gateways, any application requiring enhanced due diligence.',
    anchor: 'Arbitrum',
    image: '/tiers/tier-3.png',
  },
  {
    numeral: 'IV',
    name: 'Platinum',
    status: 'Activates Month 18+',
    tagline: "Prove you're qualified to participate.",
    borderClass: 'border-blue-900/40',
    headerClass: 'bg-blue-950/20',
    numeralClass: 'text-blue-400/70',
    statusClass: 'text-blue-400/40',
    proves: "Legally verified accredited or sophisticated investor status in the member's jurisdiction. Platinum is structured to align with accredited investor criteria under frameworks such as SEC Rule 501, FCA, and MAS rules. It proves not just who you are, but what you are legally permitted to do.",
    usedFor: 'RWA tokenization platforms, security token offerings, institutional DeFi, private credit, any application gating access by investor qualification.',
    anchor: 'Ethereum',
    image: '/tiers/tier-4.png',
  },
  {
    numeral: 'V',
    name: 'Diamond',
    status: 'Activates Month 18+',
    tagline: 'Prove your entity is who it claims to be.',
    borderClass: 'border-purple-900/40',
    headerClass: 'bg-purple-950/20',
    numeralClass: 'text-purple-400/70',
    statusClass: 'text-purple-400/40',
    proves: 'Legal entity verified, beneficial ownership transparent, AML program documented. Diamond is institutional-grade counterparty verification — the standard required by the most sophisticated participants in global finance.',
    usedFor: 'Corporate treasuries, institutional funds, market makers, non-individual counterparties, any context requiring entity-level due diligence.',
    anchor: 'Ethereum',
    image: null,
  },
];

// ── Main component ───────────────────────────────────────────────────────────

export function Docs() {
  const [activeId, setActiveId] = useState('what-is-covenant');

  // Track active section via scroll position — more reliable than IntersectionObserver
  // for short sections
  useEffect(() => {
    const handleScroll = () => {
      const offset = 90; // navbar height + a little breathing room
      for (let i = ALL_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(ALL_IDS[i]);
        if (el && el.getBoundingClientRect().top <= offset) {
          setActiveId(ALL_IDS[i]);
          return;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto flex">

        {/* ── Sticky Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 sticky top-[65px] h-[calc(100vh-65px)] border-r border-gold/15 py-10 px-6 overflow-y-auto">
          <p className="font-cinzel text-marble-muted/60 text-xs tracking-widest uppercase mb-5">
            On this page
          </p>
          <nav className="space-y-0.5">
            {TOC.map(section => (
              <div key={section.id} className="mb-1">
                <button
                  onClick={() => scrollTo(section.id)}
                  className={`w-full text-left font-cinzel text-xs tracking-wider uppercase py-1.5 transition-colors ${
                    activeId === section.id
                      ? 'text-gold'
                      : 'text-marble-muted hover:text-marble'
                  }`}
                >
                  {section.label}
                </button>
                {section.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => scrollTo(child.id)}
                    className={`w-full text-left font-cormorant italic text-sm py-1 pl-4 transition-colors border-l ${
                      activeId === child.id
                        ? 'text-gold border-gold/50'
                        : 'text-marble-muted/60 hover:text-marble-muted border-gold/10'
                    }`}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 px-6 sm:px-10 py-12 max-w-3xl">

          {/* Page header */}
          <div className="mb-14">
            <Link
              to="/demo"
              className="font-cinzel text-gold/60 hover:text-gold text-xs tracking-widest uppercase transition-colors mb-6 inline-block"
            >
              ← Return
            </Link>
            <div className="flex items-center gap-4 mb-6 opacity-50">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold"></div>
              <div className="w-1.5 h-1.5 bg-gold rotate-45"></div>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold"></div>
            </div>
            <h1 className="font-cinzel text-marble text-3xl sm:text-4xl tracking-wide mb-4">
              Documentation
            </h1>
            <p className="font-cormorant text-marble-muted italic text-xl leading-relaxed max-w-xl">
              Everything you need to understand Covenant — what it is, how it works,
              and how to build on top of it.
            </p>
          </div>

          {/* ══ SECTION 1 — What is Covenant ══════════════════════════════ */}
          <section className="mb-16">
            <SectionDivider id="what-is-covenant">What is Covenant?</SectionDivider>

            <Prose>
              Covenant is a membership protocol for verified digital identity. It exists because the
              way people prove who they are online is broken — repeated, fragmented, and increasingly
              meaningless. We built Covenant to fix that.
            </Prose>
            <Prose>
              When you join Covenant, you enter into a pact. You verify your identity once, at
              whatever level you choose, and we issue you a seal — a permanent, portable reputation
              credential that proves your verified standing across every application and protocol that
              recognizes it. Your information stays with us. What travels is your reputation.
            </Prose>

            {/* The Problem */}
            <SubHeading id="the-problem">The Problem We Solve</SubHeading>

            <Label>For People</Label>
            <Prose>
              Every financial app, every DeFi protocol, every platform that handles real money asks
              you to prove who you are. Every single time. You upload the same documents, enter the
              same information, wait for the same verification — over and over, on every platform you
              use. By the time you've done it enough times, your Social Security number feels like a
              password. That's not a user problem. That's a system problem.
            </Prose>
            <Prose>
              Covenant solves it. Verify once. Your reputation travels everywhere.
            </Prose>

            <Label>For Businesses</Label>
            <Prose>
              Financial platforms and protocols don't hold your identity data because they want to.
              They hold it because compliance requires it. And when they get breached — which happens —
              they face the consequences twice: first from the attack, then from the regulatory
              penalties that follow. They're punished for holding data nobody wanted them to have.
            </Prose>
            <Prose>
              Covenant removes that burden. Businesses that integrate Covenant access a verified member
              pool without ever touching the underlying identity data themselves. The compliance
              coverage is built in. The liability is gone.
            </Prose>

            {/* Core Concepts */}
            <SubHeading id="core-concepts">Core Concepts</SubHeading>

            <Label>The Pact</Label>
            <Prose>
              Joining Covenant is not signing up for a service. It is entering into a pact — a mutual
              agreement built on trust. You share your information with us, we protect it and verify
              it, and we give you something back: a recognized standing in the digital world that
              reflects your commitment to being trustworthy. A pact with Covenant is an agreement to
              remain trustworthy. The seal reflects that standing.
            </Prose>

            <Label>The Seal</Label>
            <Prose>
              Your Covenant seal is a Soulbound Token — a non-transferable digital credential
              permanently bound to your wallet. It cannot be sold, lent, or transferred. It was earned
              by you, and it belongs to you. The seal is both the compliance proof and the reputation
              signal. It tells any application that accepts it exactly who you are and how much they
              can trust you — without revealing your underlying identity data.
            </Prose>

            <Label>The Reputation</Label>
            <Prose>
              Your seal travels with you. Every protocol, every application, every platform that
              integrates Covenant can instantly recognize your verified standing without asking you to
              prove it again. You did the work once. Covenant does the rest for you.
            </Prose>
          </section>

          {/* ══ SECTION 2 — How It Works ═══════════════════════════════════ */}
          <section className="mb-16">
            <SectionDivider id="how-it-works">How Covenant Works</SectionDivider>

            {/* For Members */}
            <SubHeading id="for-members">For Members</SubHeading>

            <div className="space-y-3 mt-4">
              {[
                {
                  step: '01',
                  title: 'Connect Your Wallet',
                  body: 'Start by connecting your Web3 wallet to Covenant. Your wallet address becomes the anchor for your seal — it is the identity you are building a reputation for.',
                },
                {
                  step: '02',
                  title: 'Choose Your Tier',
                  body: 'Covenant offers five verification tiers, each proving a different level of identity and trust. You choose how much you share. The more you share, the more your seal proves, and the more doors it opens. Start with Bronze and build your reputation over time.',
                },
                {
                  step: '03',
                  title: 'Enter the Pact',
                  body: "Submit your verification information for the tier you've chosen. Your information is encrypted, stored securely in Covenant's protected infrastructure, and never shared without your explicit consent. Nothing personally identifying ever touches the blockchain.",
                },
                {
                  step: '04',
                  title: 'Receive Your Seal',
                  body: 'Once verified, Covenant issues your seal — a non-transferable credential minted to your wallet on Arbitrum. Your seal is immediately readable by any protocol that integrates Covenant. A cross-chain attestation is simultaneously issued on Polygon, making your reputation composable across the ecosystem.',
                },
                {
                  step: '05',
                  title: 'Your Reputation Travels',
                  body: 'From this point on, any application that checks Covenant attestations can verify your standing instantly. No re-verification. No repeated submissions. Your seal speaks for you.',
                },
              ].map(({ step, title, body }) => (
                <div
                  key={step}
                  className="flex gap-5 border border-gold/10 bg-tyrian-darker px-6 py-5"
                >
                  <div className="font-cinzel text-gold/30 text-xl font-bold leading-none shrink-0 pt-0.5">
                    {step}
                  </div>
                  <div>
                    <p className="font-cinzel text-marble text-xs tracking-widest uppercase mb-2">{title}</p>
                    <p className="font-cormorant text-marble-muted italic text-base leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>

            <Callout label="Privacy Note">
              Your identity data is never stored on-chain. The seal contains only your tier level,
              issuance date, expiry date, and jurisdiction category. Nothing more. Your personal
              information stays in Covenant's encrypted, off-chain infrastructure and is never
              transmitted to the protocols that read your seal.
            </Callout>

            {/* For Protocols */}
            <SubHeading id="for-protocols">For Protocols</SubHeading>

            <Label>What Integration Looks Like</Label>
            <Prose>
              Integrating Covenant takes a single contract read. Your protocol calls{' '}
              <code className="font-mono text-gold text-sm bg-tyrian-dark px-1.5 py-0.5">
                isValid(walletAddress, minTier)
              </code>{' '}
              and receives a boolean response. If true, the wallet holds a valid Covenant seal at or
              above your required tier. No KYC stack to build. No identity data to store. No
              compliance liability to absorb.
            </Prose>

            <Label>What You Get</Label>
            <Bullet items={[
              "Access to a growing pool of verified members whose identity has been confirmed to your required standard",
              "Compliance coverage without building or maintaining your own KYC infrastructure",
              "Seals that reflect current standing — revocation and expiry are handled automatically",
              "Cross-chain composability — Covenant attestations are readable on Arbitrum and Polygon",
            ]} />

            <Label>The Compliance Shield</Label>
            <Prose>
              When you integrate Covenant, you are not buying a tool. You are accessing a verified
              member pool with compliance coverage built in. Covenant acts as the KYC provider of
              record. You access the proof. We hold the data. The liability that comes with holding
              sensitive identity information never enters your environment.
            </Prose>
          </section>

          {/* ══ SECTION 3 — Membership Tiers ══════════════════════════════ */}
          <section className="mb-16">
            <SectionDivider id="membership-tiers">Membership Tiers</SectionDivider>

            <Prose>
              Covenant offers five verification tiers. Each tier makes a specific, honest claim about
              what has been verified and to what standard. Your tier is not just a compliance level —
              it is your recognized standing in the ecosystem.
            </Prose>
            <Prose>
              Tiers I through III are anchored on Arbitrum. Tiers IV and V are anchored on Ethereum
              for institutional permanence. Polygon serves as Covenant's first cross-chain attestation
              relay across all tiers.
            </Prose>

            <div className="space-y-4 mt-8">
              {TIERS_DOC.map(({ numeral, name, status, tagline, borderClass, headerClass, numeralClass, statusClass, proves, usedFor, anchor, image }) => (
                <div key={numeral} className={`border ${borderClass} bg-tyrian-darker overflow-hidden`}>
                  {/* Seal image */}
                  {image ? (
                    <img
                      src={image}
                      alt={`Tier ${numeral} — ${name} seal`}
                      className="w-full h-auto block border-b border-gold/10"
                    />
                  ) : (
                    <div className={`w-full aspect-video border-b border-gold/10 bg-tyrian-dark flex flex-col items-center justify-center gap-2`}>
                      <span className={`font-cinzel font-bold text-4xl leading-none ${numeralClass}`}>{numeral}</span>
                      <span className="font-cinzel text-marble-muted/30 text-xs tracking-widest uppercase">Coming Soon</span>
                    </div>
                  )}
                  <div className={`${headerClass} border-b border-gold/10 px-6 py-4 flex items-start justify-between gap-4`}>
                    <div className="flex items-center gap-4">
                      <span className={`font-cinzel font-bold text-2xl leading-none ${numeralClass}`}>
                        {numeral}
                      </span>
                      <div>
                        <p className={`font-cinzel text-sm tracking-wide ${numeralClass}`}>
                          {name} — Tier {numeral}
                        </p>
                        <p className={`font-cormorant italic text-sm ${statusClass}`}>{status}</p>
                      </div>
                    </div>
                    <span className={`font-cinzel text-xs tracking-widest uppercase shrink-0 ${statusClass}`}>
                      {anchor}
                    </span>
                  </div>
                  <div className="px-6 py-5">
                    <p className="font-cormorant text-marble italic text-base mb-4">{tagline}</p>
                    <div className="space-y-2">
                      <p className="font-cormorant text-marble-muted text-base leading-relaxed">
                        <span className="font-cinzel text-xs tracking-wide not-italic text-marble-dim">
                          What it proves:{' '}
                        </span>
                        {proves}
                      </p>
                      <p className="font-cormorant text-marble-muted text-base leading-relaxed">
                        <span className="font-cinzel text-xs tracking-wide not-italic text-marble-dim">
                          Used for:{' '}
                        </span>
                        {usedFor}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ SECTION 4 — Integration Guide ═════════════════════════════ */}
          <section className="mb-16">
            <SectionDivider id="integration-guide">Integration Guide</SectionDivider>

            <Prose>
              This section is for protocol developers and technical teams looking to integrate
              Covenant attestations into their applications. Integrating Covenant requires a single
              contract read. There is no SDK required for basic verification.
            </Prose>

            {/* Architecture */}
            <SubHeading id="architecture">Architecture Overview</SubHeading>

            <Label>On-Chain Layer</Label>
            <Prose>
              Covenant's verification seals are Soulbound Tokens (SBTs) minted on the anchor chain.
              The on-chain layer contains only non-identifying metadata:
            </Prose>
            <Bullet items={[
              'Tier level (1–5)',
              'Issuing chain ID',
              'Seal issuance date',
              'Expiry date',
              'Jurisdiction category',
              'Revocation status',
            ]} />
            <Prose>
              No personal data is stored on-chain. The seal is proof that verification happened at a
              specific tier. The underlying identity data remains in Covenant's encrypted, off-chain
              infrastructure.
            </Prose>

            <Label>Cross-Chain Attestation</Label>
            <Prose>
              Covenant issues attestations on Polygon via a lightweight relay contract. The relay
              points back to the authoritative SBT on the anchor chain. The source of truth is always
              the anchor chain. If a seal is revoked on the anchor chain, the Polygon attestation
              becomes invalid automatically.
            </Prose>

            {/* Contract Functions */}
            <SubHeading id="contract-functions">Contract Functions</SubHeading>

            <Label>Primary Query — isValid()</Label>
            <Prose>
              The simplest integration. Returns{' '}
              <code className="font-mono text-gold text-sm bg-tyrian-dark px-1.5 py-0.5">true</code>{' '}
              if the wallet holds a valid, non-expired, non-revoked Covenant seal at or above the
              specified tier.
            </Prose>
            <CodeBlock>{`function isValid(address wallet, uint8 minTier) public view returns (bool)`}</CodeBlock>

            <Label>Example Usage (Solidity)</Label>
            <CodeBlock>{`interface ICovenant {
    function isValid(address wallet, uint8 minTier) external view returns (bool);
}

contract MyProtocol {
    ICovenant public covenant;

    constructor(address covenantAddress) {
        covenant = ICovenant(covenantAddress);
    }

    modifier onlyVerified(uint8 minTier) {
        require(covenant.isValid(msg.sender, minTier), "Covenant: not verified");
        _;
    }

    // Require Silver (Tier 2) or above
    function deposit() external onlyVerified(2) {
        // your logic here
    }
}`}</CodeBlock>

            <Label>Status Query — getVerificationStatus()</Label>
            <Prose>
              Returns the full verification status for a wallet. Use this when your application needs
              more than a boolean — for example, displaying a member's tier in a UI, reading the expiry
              date, or checking burn status.
            </Prose>
            <CodeBlock>{`function getVerificationStatus(address wallet) public view returns (
    bool    verified,
    uint8   tier,
    bool    revoked,
    bool    burnPending,
    uint256 burnExecutableAt
)`}</CodeBlock>

            <Label>Raw Seal Metadata — addressToSealId() + sealData()</Label>
            <Prose>
              For applications that need the full seal record — including issuance timestamp, expiry,
              jurisdiction code, and revocation reason — resolve the seal ID first, then fetch the
              struct.
            </Prose>
            <CodeBlock>{`// Step 1: resolve the seal ID for a wallet address
function addressToSealId(address wallet) public view returns (uint256)

// Step 2: fetch the full seal record
function sealData(uint256 sealId) public view returns (
    uint8   tier,
    bytes   covenantSignature,
    uint256 mintedAt,
    uint256 expiresAt,        // 0 = no expiry
    bool    revoked,
    string  revocationReason,
    uint8   jurisdictionCode
)`}</CodeBlock>

            <Label>Seal Image — tokenURI()</Label>
            <Prose>
              Returns the IPFS metadata URI for a seal. The metadata follows the ERC721 JSON standard
              and includes the tier name, description, and a hosted seal image. Use this to display
              a member's seal visually in your application UI — for example, showing their tier badge
              on a profile or dashboard.
            </Prose>
            <CodeBlock>{`function tokenURI(uint256 sealId) public view returns (string memory)

// Example: fetch and display a member's seal image
const sealId = await pact.addressToSealId(walletAddress);
const metadataURI = await pact.tokenURI(sealId);

// metadataURI is an IPFS URI — resolve it via any gateway:
const url = metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
const metadata = await fetch(url).then(r => r.json());

console.log(metadata.name);   // e.g. "Covenant Seal — Bronze"
console.log(metadata.image);  // IPFS URI for the tier seal image`}</CodeBlock>

            {/* Contract Addresses */}
            <SubHeading id="contract-addresses">Contract Addresses</SubHeading>

            <div className="border border-gold/20 bg-tyrian-darker overflow-hidden mt-6">
              <div className="bg-tyrian-dark border-b border-gold/15 px-6 py-3 flex items-center justify-between">
                <p className="font-cinzel text-gold text-xs tracking-widest uppercase">
                  Testnet — Current
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse"></span>
                  <span className="font-cinzel text-gold/60 text-xs tracking-widest uppercase">Live</span>
                </div>
              </div>
              <div className="divide-y divide-gold/10">
                <div className="px-6 py-4">
                  <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
                    Arbitrum Sepolia — Pact (ERC-721 SBT)
                  </p>
                  <p className="font-mono text-marble-dim text-sm break-all">{PACT_ADDRESS}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-2">
                    Polygon Amoy — PactWitness (Cross-Chain Relay)
                  </p>
                  <p className="font-mono text-marble-dim text-sm break-all">{WITNESS_ADDRESS}</p>
                </div>
              </div>
              <div className="bg-tyrian-dark border-t border-gold/10 px-6 py-3">
                <p className="font-cormorant text-marble-muted/50 italic text-sm">
                  Mainnet addresses will be published upon deployment.
                </p>
              </div>
            </div>

            {/* Revocation & Expiry */}
            <SubHeading id="revocation-expiry">Revocation & Expiry</SubHeading>

            <Prose>
              Covenant seals are not permanent records. They reflect the member's current verified
              standing.
            </Prose>
            <ul className="space-y-3 mb-5">
              {[
                {
                  label: 'Expired seals:',
                  body: 'isValid() returns false automatically when expiresAt has passed.',
                },
                {
                  label: 'Revoked seals:',
                  body: 'isValid() returns false immediately upon revocation on the anchor chain.',
                },
                {
                  label: 'Cross-chain:',
                  body: 'Polygon relay attestations reflect revocation automatically — no manual action required by integrating protocols.',
                },
              ].map(({ label, body }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="w-1 h-1 bg-gold/60 rounded-full shrink-0 mt-[10px]"></span>
                  <span className="font-cormorant text-marble-muted italic text-lg leading-relaxed">
                    <span className="font-cinzel text-xs tracking-wide not-italic text-marble-dim">
                      {label}{' '}
                    </span>
                    {body}
                  </span>
                </li>
              ))}
            </ul>
            <Prose>
              Your protocol does not need to handle revocation logic.{' '}
              <code className="font-mono text-gold text-sm bg-tyrian-dark px-1.5 py-0.5">isValid()</code>{' '}
              handles it. If a member's seal is revoked for any reason, your existing{' '}
              <code className="font-mono text-gold text-sm bg-tyrian-dark px-1.5 py-0.5">isValid()</code>{' '}
              checks will begin returning false immediately.
            </Prose>

            {/* Tier Reference */}
            <SubHeading id="tier-reference">Tier Reference</SubHeading>

            <div className="overflow-x-auto mt-6">
              <table className="w-full border border-gold/20 text-sm">
                <thead>
                  <tr className="bg-tyrian-dark border-b border-gold/20">
                    {['Tier', 'Name', 'What It Proves', 'minTier'].map(h => (
                      <th
                        key={h}
                        className="font-cinzel text-xs tracking-widest uppercase text-marble-muted text-left px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tier: 'I',   name: 'Bronze',   proves: 'Real human, Sybil resistant',        min: '1' },
                    { tier: 'II',  name: 'Silver',   proves: 'Real legal identity confirmed',       min: '2' },
                    { tier: 'III', name: 'Gold',     proves: 'Enhanced due diligence complete',     min: '3' },
                    { tier: 'IV',  name: 'Platinum', proves: 'Accredited/sophisticated investor',   min: '4' },
                    { tier: 'V',   name: 'Diamond',  proves: 'Entity verified, AML certified',      min: '5' },
                  ].map(({ tier, name, proves, min }, i) => (
                    <tr
                      key={tier}
                      className={`border-b border-gold/10 ${i % 2 === 0 ? 'bg-tyrian-darker' : 'bg-tyrian-dark/40'}`}
                    >
                      <td className="font-cinzel text-gold px-4 py-3">{tier}</td>
                      <td className="font-cormorant text-marble italic px-4 py-3 whitespace-nowrap">{name}</td>
                      <td className="font-cormorant text-marble-muted italic px-4 py-3">{proves}</td>
                      <td className="font-mono text-marble-dim px-4 py-3">{min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Support */}
            <SubHeading id="support">Support</SubHeading>

            <Prose>
              For integration support, partnership inquiries, or technical questions, reach out at{' '}
              <a
                href="mailto:tonyballo@covenantprotocol.io"
                className="text-gold hover:text-gold/70 transition-colors"
              >
                tonyballo@covenantprotocol.io
              </a>{' '}
              or connect with us on Twitter at{' '}
              <a
                href="https://twitter.com/CovenantProto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold/70 transition-colors"
              >
                @CovenantProto
              </a>.
            </Prose>

            <div className="border border-gold/10 bg-tyrian-darker px-6 py-6 mt-10 text-center">
              <div className="flex items-center justify-center gap-4 mb-4 opacity-40">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-gold"></div>
                <div className="w-1 h-1 bg-gold rotate-45"></div>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-gold"></div>
              </div>
              <p className="font-cinzel text-marble-muted text-xs tracking-widest uppercase mb-1">
                Covenant Protocol LLC
              </p>
              <p className="font-cormorant text-marble-muted/50 italic text-sm">
                Compliance without compromise. Verified by trust, not by transaction.
              </p>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
}
