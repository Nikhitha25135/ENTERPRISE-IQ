export default function Logo({ tone = 'dark', className = '' }) {
  const strokeColor = tone === 'light' ? '#EFEEE7' : '#1D2540';
  const boxFill = tone === 'light' ? 'transparent' : '#1D2540';
  const boxStroke = tone === 'light' ? '#EFEEE7' : '#1D2540';
  const wordColor = tone === 'light' ? 'text-paper' : 'text-ink';

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="26" height="26" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="61" height="61" rx="12" fill={boxFill} stroke={boxStroke} strokeWidth="1.5" />
        <path d="M18 20 L46 20 M18 32 L38 32 M18 44 L46 44" stroke={tone === 'light' ? '#EFEEE7' : '#EFEEE7'} strokeWidth="4" strokeLinecap="round" />
        <circle cx="47" cy="44" r="4.5" fill="#A9803F" />
      </svg>
      <span className={`font-display text-[18px] font-semibold tracking-[-0.01em] ${wordColor}`}>
        Enterprise<span className="text-brass">IQ</span>
      </span>
    </span>
  );
}
