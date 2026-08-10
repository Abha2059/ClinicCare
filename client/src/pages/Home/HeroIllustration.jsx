/**
 * Original ClinicCare hero artwork — an abstract "appointment card" composition.
 * Drawn inline as SVG so it needs no external asset and scales cleanly.
 */
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <svg
        viewBox="0 0 460 420"
        className="h-auto w-full drop-shadow-[0_24px_48px_rgba(16,24,40,0.12)]"
        role="img"
        aria-label="Illustration of a healthcare appointment being scheduled"
      >
        <defs>
          <linearGradient id="hero-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f2fbf8" />
          </linearGradient>
          <linearGradient id="hero-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#43c0a4" />
            <stop offset="100%" stopColor="#106b5b" />
          </linearGradient>
          <linearGradient id="hero-accent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbb171" />
            <stop offset="100%" stopColor="#f66b13" />
          </linearGradient>
        </defs>

        {/* Ambient blobs */}
        <circle cx="380" cy="70" r="66" fill="#d5f5eb" />
        <circle cx="64" cy="330" r="48" fill="#ffead4" />

        {/* Main appointment card */}
        <g>
          <rect x="60" y="58" width="300" height="220" rx="24" fill="url(#hero-card)" stroke="#d5f5eb" strokeWidth="2" />

          {/* Card header: doctor row */}
          <circle cx="106" cy="106" r="24" fill="url(#hero-brand)" />
          <path
            d="M106 118c-6-3.6-11-7.6-11-13.2a4.2 4.2 0 0 1 7.4-2.7 4.2 4.2 0 0 1 7.4 2.7c0 5.6-5 9.6-11 13.2Z"
            fill="#ffffff"
            opacity=".95"
          />
          <rect x="142" y="92" width="132" height="12" rx="6" fill="#1c2534" opacity=".85" />
          <rect x="142" y="112" width="86" height="10" rx="5" fill="#5a7393" opacity=".55" />

          {/* Star rating */}
          <g fill="#f8a838">
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                transform={`translate(${142 + i * 18} 132)`}
                d="M6 0l1.8 3.9 4.2.5-3.1 2.9.8 4.2L6 9.4 2.3 11.5l.8-4.2L0 4.4l4.2-.5L6 0z"
              />
            ))}
          </g>

          {/* Divider */}
          <rect x="92" y="164" width="236" height="1.5" rx="1" fill="#cfd8e3" opacity=".7" />

          {/* Date pills — the middle one is "selected" */}
          {[0, 1, 2, 3, 4].map((i) => {
            const selected = i === 2
            return (
              <g key={i} transform={`translate(${92 + i * 48} 182)`}>
                <rect
                  width="38"
                  height="52"
                  rx="12"
                  fill={selected ? 'url(#hero-brand)' : '#ffffff'}
                  stroke={selected ? 'none' : '#cfd8e3'}
                  strokeWidth="1.5"
                />
                <rect x="10" y="12" width="18" height="5" rx="2.5" fill={selected ? '#ffffff' : '#a8b8cb'} opacity={selected ? '.9' : '1'} />
                <rect x="8" y="25" width="22" height="9" rx="3" fill={selected ? '#ffffff' : '#7a91ad'} />
              </g>
            )
          })}
        </g>

        {/* Floating "confirmed" chip */}
        <g transform="translate(258 250)">
          <rect width="164" height="58" rx="18" fill="#ffffff" stroke="#d5f5eb" strokeWidth="2" />
          <circle cx="34" cy="29" r="16" fill="url(#hero-brand)" />
          <path
            d="M27 29.5l4.6 4.6 9-9.4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="60" y="18" width="84" height="9" rx="4.5" fill="#1c2534" opacity=".8" />
          <rect x="60" y="33" width="56" height="8" rx="4" fill="#5a7393" opacity=".5" />
        </g>

        {/* Floating clock chip */}
        <g transform="translate(36 168)">
          <rect width="120" height="54" rx="18" fill="#ffffff" stroke="#ffead4" strokeWidth="2" />
          <circle cx="31" cy="27" r="15" fill="url(#hero-accent)" />
          <path
            d="M31 19v8.6l5.4 3.2"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="56" y="17" width="48" height="8" rx="4" fill="#1c2534" opacity=".8" />
          <rect x="56" y="31" width="34" height="7" rx="3.5" fill="#5a7393" opacity=".5" />
        </g>

        {/* Heartbeat line */}
        <path
          d="M96 336h44l12-22 16 44 14-30h48"
          fill="none"
          stroke="url(#hero-brand)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}
