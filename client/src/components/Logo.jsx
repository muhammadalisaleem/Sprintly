// sprintly logo: dark rounded square with the S + orange dot, then the name
// size = height of the icon in px, the text scales with it
function Logo({ size = 32, showName = true }) {
  return (
    <span className="brand" style={{ gap: size * 0.28 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="24" fill="#121826" />
        <path
          d="M72 28H42a11 11 0 0 0 0 22h19a11 11 0 0 1 0 22H45"
          fill="none"
          stroke="#fff"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <circle cx="29" cy="72" r="5.5" fill="#ff6b35" />
      </svg>
      {showName && (
        <span className="brand-name" style={{ fontSize: size * 0.8 }}>
          Sprintly
        </span>
      )}
    </span>
  )
}

export default Logo
