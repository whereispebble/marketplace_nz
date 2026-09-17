/** Branded loading state shared by routes and data-heavy pages. */
export default function LoadingScreen({ fullPage = false, label = 'Loading Swapy' }) {
  return (
    <div className={`brand-loader ${fullPage ? 'brand-loader-full' : ''}`} role="status" aria-live="polite">
      <div className="brand-loader-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <rect x="2" y="2" width="44" height="44" rx="13" fill="#101815" />
          <g className="brand-loader-arrows">
            <path d="M14 20.8C18.5 15.5 26.2 14.5 31.9 18.4L35 15.4V26.2H24.1L27.6 22.7C24.1 20.7 19.9 21.4 17.4 24.5L14 20.8Z" fill="#14BC7D" />
            <path d="M34 28.1C29.5 33.5 21.8 34.5 16.1 30.6L13 33.6V22.8H23.9L20.4 26.3C23.9 28.3 28.1 27.6 30.6 24.5L34 28.1Z" fill="white" />
          </g>
        </svg>
      </div>
      <strong>Swapy</strong>
      <span className="sr-only">{label}</span>
    </div>
  )
}
