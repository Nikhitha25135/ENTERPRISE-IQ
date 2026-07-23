import './Logo.css';

export default function Logo({ tone = 'dark', className = '' }) {
  const strokeColor = tone === 'light' ? '#F6F8F9' : '#0F3D3E';
  const boxFill = tone === 'light' ? 'transparent' : '#0F3D3E';
  const boxStroke = tone === 'light' ? '#F6F8F9' : '#0F3D3E';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="61" height="61" rx="12" fill={boxFill} stroke={boxStroke} strokeWidth="1.5" />
        <path d="M18 20 L46 20 M18 32 L38 32 M18 44 L46 44" stroke="#F6F8F9" strokeWidth="4" strokeLinecap="round" />
        <circle cx="47" cy="44" r="4.5" fill="#2BB673" />
      </svg>
      <span className={`logo-wordmark ${tone} text-[18px]`}>
        Enterprise<span className="logo-accent">IQ</span>
      </span>
    </span>
  );
}
