export function SceneBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Warm amber glow at top */}
      <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,_rgba(246,181,72,0.18),_transparent_58%)]" />

      {/* Subtle blue-gray accent — right side */}
      <div className="absolute -right-60 top-[5%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,_rgba(180,200,230,0.22),_transparent_60%)] blur-3xl" />

      {/* Road vanishing lines */}
      <svg
        className="absolute bottom-0 left-0 right-0 h-[420px] w-full opacity-[0.07]"
        viewBox="0 0 1440 420"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[-420, -240, -60, 60, 240, 420].map((offset, i) => (
          <line
            key={i}
            x1={720 + offset * 4}
            y1={420}
            x2={720}
            y2={-40}
            stroke="#1e3a5f"
            strokeWidth="1.5"
          />
        ))}
        {[60, 130, 210, 300, 380].map((y, i) => {
          const ratio = (420 - y) / 460;
          const half = 420 * ratio;
          return (
            <line
              key={i}
              x1={720 - half}
              y1={y}
              x2={720 + half}
              y2={y}
              stroke="#1e3a5f"
              strokeWidth="1"
            />
          );
        })}
      </svg>

      {/* ADR Gefahrentafel 33/1203 — top-right, darker for light bg */}
      <svg
        className="absolute -right-12 top-4 h-[480px] w-[430px] opacity-[0.10] lg:opacity-[0.14]"
        viewBox="0 0 400 200"
        aria-hidden
      >
        <rect x="2" y="2" width="396" height="196" rx="8" ry="8"
          fill="rgba(232,160,48,0.07)" stroke="#c97d10" strokeWidth="6" />
        <line x1="2" y1="100" x2="398" y2="100"
          stroke="#c97d10" strokeWidth="4" />
        <text x="200" y="82" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Arial Black, Arial, sans-serif" fontSize="72"
          fontWeight="900" fill="#c97d10">33</text>
        <text x="200" y="155" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Arial Black, Arial, sans-serif" fontSize="66"
          fontWeight="900" fill="#c97d10">1203</text>
      </svg>

      {/* Hazard diamond Class 3 — bottom-left */}
      <svg
        className="absolute -bottom-10 -left-14 h-[340px] w-[340px] opacity-[0.10] lg:opacity-[0.14]"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <rect
          x="100" y="8" width="130" height="130"
          rx="6" ry="6"
          transform="rotate(45 100 100)"
          fill="rgba(232,160,48,0.08)" stroke="#c97d10" strokeWidth="5"
        />
        <path
          d="M100 60 C90 72 82 80 88 92 C82 88 80 80 84 70
             C76 82 78 96 86 104 C80 100 76 92 78 82
             C68 96 72 118 88 126 C100 132 116 128 120 114
             C128 98 118 84 110 76 C114 86 112 96 106 102
             C108 90 104 74 100 60Z"
          fill="#c97d10"
        />
        <text x="100" y="148" textAnchor="middle"
          fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700"
          fill="#c97d10">3</text>
      </svg>

      {/* Small diamond outline — top-left */}
      <svg
        className="absolute left-[5%] top-[14%] h-[180px] w-[180px] rotate-12 opacity-[0.08]"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <rect
          x="100" y="8" width="130" height="130"
          rx="6" ry="6"
          transform="rotate(45 100 100)"
          fill="none" stroke="#1e3a5f" strokeWidth="4"
        />
      </svg>

      {/* Truck silhouette — center-bottom */}
      <svg
        className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-[0.07] lg:opacity-[0.10]"
        width="980" height="230"
        viewBox="0 0 980 230"
        aria-hidden
      >
        <rect x="60" y="65" width="580" height="120" rx="8" fill="#1e3a5f" />
        <path d="M640 125 L640 65 L705 65 Q768 65 795 105 L825 145 L825 185 L640 185Z"
          fill="#1e3a5f" />
        <circle cx="160" cy="190" r="30" fill="#1e3a5f" />
        <circle cx="290" cy="190" r="30" fill="#1e3a5f" />
        <circle cx="530" cy="190" r="30" fill="#1e3a5f" />
        <circle cx="650" cy="190" r="30" fill="#1e3a5f" />
        <circle cx="750" cy="190" r="30" fill="#1e3a5f" />
        <rect x="255" y="92" width="108" height="54" rx="4" fill="#e8a030" />
        <line x1="255" y1="119" x2="363" y2="119" stroke="#111" strokeWidth="3" />
        <text x="309" y="110" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Arial Black" fontSize="15" fontWeight="900" fill="#111">33</text>
        <text x="309" y="136" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Arial Black" fontSize="14" fontWeight="900" fill="#111">1203</text>
      </svg>

      {/* Grid overlay */}
      <div className="grid-overlay absolute inset-0 opacity-100" />
    </div>
  );
}
