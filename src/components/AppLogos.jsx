export function TelePLogo({ height = 32 }) {
  const w = height * 3
  const h = height
  const r = h * 0.28

  return (
    <svg height={h} width={w} viewBox="0 0 96 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tpGrad" x1="0" y1="0" x2="96" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0070E0"/>
          <stop offset="100%" stopColor="#0047AB"/>
        </linearGradient>
      </defs>

      {/* Background pill */}
      <rect width="96" height="32" rx="9" fill="url(#tpGrad)"/>

      {/* Subtle shine */}
      <rect width="96" height="16" rx="9" fill="white" fillOpacity="0.07"/>

      {/* "tele" word */}
      <text
        x="10" y="22"
        fontFamily="Arial,Helvetica,sans-serif"
        fontSize="14"
        fontWeight="300"
        letterSpacing="1.5"
        fill="white"
        fillOpacity="0.92"
      >Tele</text>

      {/* Divider */}
      <line x1="55" y1="8" x2="55" y2="24" stroke="white" strokeOpacity="0.3" strokeWidth="1"/>

      {/* Big "P" */}
      <text
        x="63" y="23"
        fontFamily="Arial,Helvetica,sans-serif"
        fontSize="19"
        fontWeight="800"
        fill="white"
      >P</text>
    </svg>
  )
}

export function EasyParkLogo({ height = 28 }) {
  return (
    <img
      src="https://a.storyblok.com/f/167931/1398x426/ee7e140a16/easypark-linear-container-logotype_rgb.png/m/384x0/filters:format(avif):quality(50)"
      alt="EasyPark"
      height={height}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
