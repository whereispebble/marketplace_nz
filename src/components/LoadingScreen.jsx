/** Branded loading state shared by routes and data-heavy pages. */
export default function LoadingScreen({ fullPage = false, label = 'Loading Moonwalk' }) {
  return (
    <div className={`brand-loader ${fullPage ? 'brand-loader-full' : ''}`} role="status" aria-live="polite">
      <div className="brand-loader-mark" aria-hidden="true">
        <img className="brand-loader-moon" src="/branding/moonwalk-moon.svg" width="64" height="64" alt="" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
