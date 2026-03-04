/** Shopping-bag icon inside a hexagon — the IDSS brand mark. */
export default function IDSSLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-label="IDSS logo"
    >
      {/* Hexagon background */}
      <polygon
        points="16,1.5 28.5,8.75 28.5,23.25 16,30.5 3.5,23.25 3.5,8.75"
        fill="#8C1515"
      />
      {/* Shopping bag handle */}
      <path
        d="M12 13 C12 10.8 13.2 9.5 16 9.5 C18.8 9.5 20 10.8 20 13"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Shopping bag body */}
      <rect
        x="10"
        y="13"
        width="12"
        height="9"
        rx="1.5"
        stroke="white"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}
