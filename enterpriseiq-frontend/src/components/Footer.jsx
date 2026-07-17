import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-navy-900 text-paper/70">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs font-body text-[13.5px] leading-relaxed text-paper/50">
              A private answer engine over your company's own documents — every claim traced back to a page.
            </p>
          </div>
          <div>
            <p className="eyebrow text-brass-400/80">Product</p>
            <ul className="mt-3 space-y-2 font-body text-[13.5px] text-paper/60">
              <li><a href="/#platform" className="hover:text-paper">Platform</a></li>
              <li><a href="/#how-it-works" className="hover:text-paper">How it works</a></li>
              <li><a href="/#security" className="hover:text-paper">Security</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-brass-400/80">Account</p>
            <ul className="mt-3 space-y-2 font-body text-[13.5px] text-paper/60">
              <li><a href="/login" className="hover:text-paper">Sign in</a></li>
              <li><a href="/register" className="hover:text-paper">Create account</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow text-brass-400/80">Ledger</p>
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-paper/40">
              v0.1.0 · SOC2-ready<br />architecture · JWT + RBAC
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-paper/10 pt-6 font-mono text-[11px] text-paper/35 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} EnterpriseIQ. All rights reserved.</span>
          <span>Built for finance · hr · legal · sales · operations</span>
        </div>
      </div>
    </footer>
  );
}
