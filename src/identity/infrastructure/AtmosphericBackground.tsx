export function AtmosphericBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, var(--cream-dark) 1px, transparent 1px),
            linear-gradient(to bottom, var(--cream-dark) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: 0.4,
        }}
      />

      {/* Radial center glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, var(--cream) 0%, var(--cream-dark) 40%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      {/* Concentric SVG rings */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px]"
        viewBox="0 0 1200 1200"
        fill="none"
      >
        <circle cx="600" cy="600" r="550" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.08" strokeDasharray="8 12" />
        <circle cx="600" cy="600" r="450" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.06" />
        <circle cx="600" cy="600" r="350" stroke="var(--indigo)" strokeWidth="0.75" strokeOpacity="0.05" strokeDasharray="4 8" />
        <circle cx="600" cy="600" r="250" stroke="var(--indigo)" strokeWidth="0.5" strokeOpacity="0.04" />
        <path d="M600 100 L1100 600 L600 1100 L100 600 Z" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.05" fill="none" />
        <path d="M600 200 L1000 600 L600 1000 L200 600 Z" stroke="var(--indigo)" strokeWidth="0.75" strokeOpacity="0.04" fill="none" />
        <line x1="600" y1="50" x2="600" y2="150" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.08" />
        <line x1="600" y1="1050" x2="600" y2="1150" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.08" />
        <line x1="50" y1="600" x2="150" y2="600" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.08" />
        <line x1="1050" y1="600" x2="1150" y2="600" stroke="var(--indigo)" strokeWidth="1" strokeOpacity="0.08" />
        <circle cx="600" cy="50" r="3" fill="var(--indigo)" fillOpacity="0.12" />
        <circle cx="600" cy="1150" r="3" fill="var(--indigo)" fillOpacity="0.12" />
        <circle cx="50" cy="600" r="3" fill="var(--indigo)" fillOpacity="0.12" />
        <circle cx="1150" cy="600" r="3" fill="var(--indigo)" fillOpacity="0.12" />
      </svg>

      {/* Color blurs */}
      <div className="absolute inset-0">
        <div
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--mint) 0%, transparent 70%)", opacity: 0.03, filter: "blur(80px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, var(--lavender) 0%, transparent 70%)", opacity: 0.05, filter: "blur(60px)" }}
        />
      </div>

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(45,55,72,0.04) 70%, rgba(45,55,72,0.1) 100%)`,
        }}
      />
    </div>
  )
}
