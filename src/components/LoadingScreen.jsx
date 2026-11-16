import BrandLogo from './BrandLogo'

/** Branded loading state shared by routes and data-heavy pages. */
export default function LoadingScreen({ fullPage = false, label = 'Loading Outsee' }) {
  return (
    <div className={fullPage ? 'brand-loader brand-loader-full' : 'brand-loader'} role="status">
      <BrandLogo className="brand-loader-logo" decorative />
      <span className="brand-loader-label">{label}</span>
    </div>
  )
}
