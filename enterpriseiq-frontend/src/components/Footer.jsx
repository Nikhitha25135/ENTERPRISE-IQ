import Logo from './Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="footer-tagline mt-4 max-w-xs font-body text-[13.5px] leading-relaxed">
              A private answer engine over your company's own documents — every claim traced back to a page.
            </p>
          </div>
          <div>
            <p className="footer-heading">Product</p>
            <ul className="mt-3 space-y-2 font-body text-[13.5px]">
              <li><a href="/#platform" className="footer-link">Platform</a></li>
              <li><a href="/#how-it-works" className="footer-link">How it works</a></li>
              <li><a href="/#security" className="footer-link">Security</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">Account</p>
            <ul className="mt-3 space-y-2 font-body text-[13.5px]">
              <li><a href="/login" className="footer-link">Sign in</a></li>
              <li><a href="/register" className="footer-link">Create account</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-heading">Ledger</p>
            <p className="footer-meta mt-3 font-mono text-[12px] leading-relaxed">
              v0.1.0 · SOC2-ready<br />architecture · JWT + RBAC
            </p>
          </div>
        </div>
        <div className="footer-bottom mt-12 flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EnterpriseIQ. All rights reserved.</span>
          <span>Built for finance · hr · legal · sales · operations</span>
        </div>
      </div>
    </footer>
  );
}
