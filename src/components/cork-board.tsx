// Cork board background — pure CSS + inline SVG turbulence, no external assets

export function CorkBoard() {
  return (
    <div className="absolute inset-0" style={{ backgroundColor: "#B8844A" }}>
      {/* Organic grain via SVG fractal noise */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <filter
            id="cork-grain"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="linearRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72 0.52"
              numOctaves="4"
              seed="11"
              stitchTiles="stitch"
              result="noise"
            />
            {/* Map noise to warm cork tones: R ~0.60–0.84, G ~0.44–0.60, B ~0.22–0.34 */}
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0.24 0 0 0 0.60
                      0.16 0 0 0 0.44
                      0.12 0 0 0 0.22
                      0    0 0 0 1"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#cork-grain)" />
      </svg>

      {/* Fine horizontal striations — real cork has a fibrous grain */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(178deg, transparent 0px, transparent 3px, rgba(0,0,0,0.025) 3px, rgba(0,0,0,0.025) 4px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Soft vignette — makes it feel like a framed board */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </div>
  );
}
