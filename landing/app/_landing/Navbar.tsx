import { CtaButton } from './CtaButton'

export function Navbar() {
  return (
    <header className="lp-nav">
      <a href="#top" className="lp-logo" aria-label="Escros home">
        <LogoMark />
        <span>Escros</span>
      </a>
      <nav className="lp-nav-links" aria-label="Primary">
        <a href="#about">About</a>
        <a href="#compare">Comparison</a>
        <a href="#roadmap">Roadmap</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div className="lp-nav-right">
        <CtaButton>Try the demo</CtaButton>
      </div>
    </header>
  )
}

function LogoMark() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="8" fill="url(#lp-logo-grad)" />
      <path d="M9 8.5h10M9 13.5h7M9 18.5h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient
          id="lp-logo-grad"
          x1="0"
          y1="0"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#68004d" />
          <stop offset="1" stopColor="#8a3210" />
        </linearGradient>
      </defs>
    </svg>
  )
}
