export default function BrandLogo({ className = '', decorative = false }) {
  return (
    <span className={`outsee-logo ${className}`.trim()}>
      <img src="/branding/outsee-logo.webp" width="728" height="154" alt={decorative ? '' : 'Outsee'} />
    </span>
  )
}
