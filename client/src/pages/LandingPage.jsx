import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const LandingPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("theme");
                if (stored) return stored;
            } catch (e) {
                console.warn("localStorage is not accessible:", e);
            }
            try {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            } catch (e) {
                return "light";
            }
        }
        return "light";
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        try {
            localStorage.setItem("theme", theme);
        } catch (e) {
            console.warn("localStorage is not accessible:", e);
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    const handleCopyDemoLink = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText("https://fileshare.sys/download/x92b-vacation");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-canvas text-ink flex flex-col transition-colors duration-200">
            {/* Top Navigation */}
            <header className="sticky top-0 z-50 h-16 w-full border-b border-hairline bg-canvas/80 backdrop-blur-md transition-colors duration-200">
                <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate("/")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-6.5 w-6.5 text-primary">
                            <path d="M5 5l7 14 7-14" />
                        </svg>
                        <span className="font-display text-base font-bold uppercase tracking-wider text-primary">
                            Vaultix
                        </span>
                    </div>

                    {/* Nav Links - Desktop */}
                    <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-muted select-none">
                        <a href="#features" className="hover:text-primary transition-colors">Features</a>
                        <a href="#mockups" className="hover:text-primary transition-colors">Showcase</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    </nav>

                    {/* CTA Cluster */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            aria-label="Toggle theme"
                            className="rounded-full p-2 hover:bg-surface-soft transition-colors cursor-pointer text-muted hover:text-ink"
                        >
                            {theme === "dark" ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {token ? (
                            <Link
                                to="/files"
                                className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
                            >
                                Go to Workspace
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-primary transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="rounded-md bg-primary px-4.5 py-2 text-xs font-semibold text-on-primary hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
                                >
                                    Sign Up Free
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Band Section */}
            <section className="mx-auto max-w-[1200px] px-6 py-16 md:py-24 w-full text-left">
                <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                    {/* Hero Left Content */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Interactive Pill Accent */}
                        <div className="inline-flex items-center gap-2 rounded-full bg-success/10 border border-success/15 dark:border-success/25 px-3 py-1 text-[11px] font-semibold tracking-wider text-success dark:text-success/90 uppercase">
                            <span>Update v1.0</span>
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            <span>System-Wide Dark Mode</span>
                        </div>

                        <h1 className="font-display font-semibold tracking-tight text-ink text-5xl md:text-6xl max-w-2xl leading-none">
                            The better way to share your files
                        </h1>
                        <p className="text-base md:text-lg text-muted leading-8 max-w-xl">
                            Upload documents instantly, browse through virtual folders, preview media, and control your download links from a clean, white canvas workspace.
                        </p>

                        <div className="flex flex-wrap items-center gap-3.5 pt-2">
                            <Link
                                to={token ? "/files" : "/register"}
                                className="rounded-md bg-primary px-6 py-3 text-xs font-semibold text-on-primary hover:bg-primary-hover transition-all focus-visible:ring-2 focus-visible:ring-primary active:scale-98 cursor-pointer shadow-md"
                            >
                                Get Started Free
                            </Link>
                            <a
                                href="#features"
                                className="rounded-md border border-hairline bg-canvas px-6 py-3 text-xs font-semibold text-ink hover:bg-surface-soft transition-all active:scale-98 cursor-pointer"
                            >
                                Explore Features
                            </a>
                        </div>
                    </div>

                    {/* Hero Right Mockup Card */}
                    <div className="lg:col-span-5">
                        <div className="relative rounded-xl border border-hairline bg-canvas p-6 shadow-2xl transition-all duration-200">
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-hairline pb-4 mb-4 select-none">
                                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                                    <span className="text-xl">📁</span>
                                    <span>photos / summer / vacation.png</span>
                                </div>
                                <span className="badge badge-shared font-mono">
                                    SHARED
                                </span>
                            </div>

                            {/* Card Image Area */}
                            <div className="flex items-center justify-center rounded-lg bg-surface-card p-4 min-h-48 border border-hairline mb-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/20 to-blue-400/10 mix-blend-overlay" />
                                {/* Stylized Mountain SVG placeholder representation */}
                                <svg className="h-32 w-full text-muted-soft opacity-60" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 50 L40 15 L55 35 L70 20 L90 50 Z" fill="currentColor" />
                                    <circle cx="25" cy="15" r="4" fill="orange" />
                                </svg>
                            </div>

                            {/* Card Meta Stats */}
                            <div className="flex justify-between text-[11px] text-muted font-medium mb-4 select-none">
                                <span>Size: 4.2 MB</span>
                                <span className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4a3 3 0 00-3-3m3 3a3 3 0 003-3m-3 3V4" />
                                    </svg>
                                    142 Downloads
                                </span>
                            </div>

                            {/* Share link input */}
                            <div className="rounded-lg bg-surface-soft p-3.5 space-y-2.5 border border-hairline text-left">
                                <span className="text-xs font-semibold text-primary block">Direct Share Link</span>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value="https://fileshare.sys/download/x92b-vacation"
                                        className="flex-1 rounded-md border border-hairline bg-canvas px-3 py-1.5 text-xs text-muted focus:outline-none"
                                    />
                                    <button
                                        onClick={handleCopyDemoLink}
                                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                            copied ? "bg-success text-white" : "bg-primary text-on-primary hover:bg-primary-hover active:scale-95"
                                        }`}
                                    >
                                        {copied ? "Copied!" : "Copy"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Section Grid */}
            <section id="features" className="bg-surface-soft border-y border-hairline py-20 md:py-24 text-left transition-colors duration-200">
                <div className="mx-auto max-w-[1200px] px-6">
                    <header className="max-w-xl mb-12">
                        <h2 className="font-display font-semibold tracking-tight text-ink text-4xl mb-4">
                            Your all-purpose file workspace
                        </h2>
                        <p className="text-sm text-muted leading-6">
                            distribute assets, preview documents, and structure shares. Everything is optimized to prioritize files, not complex admin charts.
                        </p>
                    </header>

                    {/* 3-Up Feature Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Card 1 */}
                        <div className="rounded-lg bg-canvas p-8 border border-hairline space-y-4">
                            <div className="rounded-lg bg-warning/10 border border-warning/15 dark:border-warning/25 text-warning dark:text-warning/90 p-3 w-fit select-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                                Client-side Folder System
                            </h3>
                            <p className="text-xs text-muted leading-5">
                                Structure files hierarchically by formatting paths with slashes. Group files dynamically into virtual folders without any server-side database requirements.
                            </p>
                        </div>
 
                        {/* Card 2 */}
                        <div className="rounded-lg bg-canvas p-8 border border-hairline space-y-4">
                            <div className="rounded-lg bg-badge-pink/10 border border-badge-pink/15 dark:border-badge-pink/25 text-badge-pink dark:text-badge-pink/90 p-3 w-fit select-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                                Slide-over Previews
                            </h3>
                            <p className="text-xs text-muted leading-5">
                                Inspect file details instantly. Fetch and display image files or read text and code contents inline inside a sliding panel directly within the browser view.
                            </p>
                        </div>
 
                        {/* Card 3 */}
                        <div className="rounded-lg bg-canvas p-8 border border-hairline space-y-4">
                            <div className="rounded-lg bg-success/10 border border-success/15 dark:border-success/25 text-success dark:text-success/90 p-3 w-fit select-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-2.617 2.943L3 10.742m15.316 0l-2.617 2.943L13 10.742M12 4v12" />
                                </svg>
                            </div>
                            <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                                Direct Sharing Workflows
                            </h3>
                            <p className="text-xs text-muted leading-5">
                                Generate and distribute direct download endpoints instantly. Provide secure download link copying with animated feedback for immediate team distribution.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Product Mockup Showcase */}
            <section id="mockups" className="py-20 md:py-24 text-center">
                <div className="mx-auto max-w-[1200px] px-6">
                    <header className="max-w-xl mx-auto mb-12">
                        <h2 className="font-display font-semibold tracking-tight text-ink text-4xl mb-4">
                            Designed around your content
                        </h2>
                        <p className="text-sm text-muted leading-6">
                            No placeholders or decorative abstractions. The Vaultix workspace presents your folders and file extensions cleanly and visualizes previews immediately.
                        </p>
                    </header>

                    {/* Virtual folder dashboard layout mock */}
                    <div className="rounded-xl border border-hairline bg-surface-card p-6 md:p-8 max-w-4xl mx-auto shadow-lg">
                        <div className="flex flex-col gap-6 md:flex-row">
                            {/* Directories navigation list */}
                            <div className="w-full md:w-1/3 space-y-3 text-left">
                                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Directories</h4>
                                <div className="rounded-lg border border-hairline bg-canvas p-3 flex items-center gap-2 select-none shadow-xs">
                                    <span>📁</span>
                                    <span className="text-xs font-semibold text-ink">documents</span>
                                </div>
                                <div className="rounded-lg border border-hairline bg-canvas p-3 flex items-center gap-2 select-none shadow-xs">
                                    <span>📁</span>
                                    <span className="text-xs font-semibold text-ink">assets</span>
                                </div>
                                <div className="rounded-lg border border-hairline bg-canvas p-3 flex items-center gap-2 select-none shadow-xs">
                                    <span>📁</span>
                                    <span className="text-xs font-semibold text-ink">codes</span>
                                </div>
                            </div>

                            {/* Files mockup blocks */}
                            <div className="flex-1 space-y-3 text-left">
                                <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider">Recent Files</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-hairline bg-canvas p-4 flex items-center gap-3 select-none">
                                        <span className="badge badge-pink font-mono px-2 py-1 text-xs">ZIP</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-ink">build-assets.zip</p>
                                            <p className="text-[10px] text-muted-soft">14.8 MB</p>
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-hairline bg-canvas p-4 flex items-center gap-3 select-none">
                                        <span className="badge badge-violet font-mono px-2 py-1 text-xs">PDF</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-ink">invoice-summary.pdf</p>
                                            <p className="text-[10px] text-muted-soft">1.2 MB</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing / Capabilities Grid Section */}
            <section id="pricing" className="bg-surface-soft border-t border-hairline py-20 md:py-24 text-left transition-colors duration-200">
                <div className="mx-auto max-w-[1200px] px-6">
                    <header className="max-w-xl mb-12">
                        <h2 className="font-display font-semibold tracking-tight text-ink text-4xl mb-4">
                            Transparent plans
                        </h2>
                        <p className="text-sm text-muted leading-6">
                            Choose the plan that matches your workspace requirements. No hidden user fees, cancel at any time.
                        </p>
                    </header>

                    {/* 3-Up Pricing Tier Cards Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Starter Tier */}
                        <div className="rounded-lg bg-canvas p-8 border border-hairline flex flex-col justify-between min-h-96">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Starter</h3>
                                <p className="font-display text-4xl font-semibold tracking-tight text-ink mt-3">$0</p>
                                <p className="text-xs text-muted-soft mt-1">free forever</p>
                                
                                <ul className="mt-8 space-y-3 text-xs text-muted">
                                    <li className="flex items-center gap-2">✓ Upload files up to 10MB</li>
                                    <li className="flex items-center gap-2">✓ Standard sharing links</li>
                                    <li className="flex items-center gap-2">✓ Flat file listings</li>
                                </ul>
                            </div>

                            <Link
                                to={token ? "/files" : "/register"}
                                className="rounded-md border border-hairline bg-canvas py-2.5 text-center text-xs font-semibold text-ink hover:bg-surface-soft transition-colors mt-8 select-none focus-visible:ring-2 focus-visible:ring-primary block cursor-pointer"
                            >
                                Sign Up Free
                            </Link>
                        </div>

                        {/* Pro Tier (Featured Inverted Dark Surface!) */}
                        <div className="rounded-lg bg-surface-dark p-8 border border-zinc-800 text-on-dark flex flex-col justify-between min-h-96 shadow-lg relative overflow-hidden">
                            <div className="absolute right-4 top-4 rounded-full bg-success/15 border border-success/30 text-success px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                                POPULAR
                            </div>

                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-on-dark-soft">Pro Workspace</h3>
                                <p className="font-display text-4xl font-semibold tracking-tight text-on-dark mt-3">$12</p>
                                <p className="text-xs text-[#71717a] mt-1">per user / billed monthly</p>
                                
                                <ul className="mt-8 space-y-3 text-xs text-on-dark-soft">
                                    <li className="flex items-center gap-2 text-on-dark">✓ Upload files up to 1Gb</li>
                                    <li className="flex items-center gap-2 text-on-dark">✓ Custom Folder hierarchy</li>
                                    <li className="flex items-center gap-2 text-on-dark">✓ Slide-over preview sheets</li>
                                    <li className="flex items-center gap-2 text-on-dark">✓ System-wide light/dark themes</li>
                                </ul>
                            </div>

                            <Link
                                to={token ? "/files" : "/register"}
                                className="rounded-md bg-white py-2.5 text-center text-xs font-semibold text-black hover:bg-zinc-200 transition-colors mt-8 select-none focus-visible:ring-2 focus-visible:ring-white block cursor-pointer"
                            >
                                Start Pro Trial
                            </Link>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="rounded-lg bg-canvas p-8 border border-hairline flex flex-col justify-between min-h-96">
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Enterprise</h3>
                                <p className="font-display text-4xl font-semibold tracking-tight text-ink mt-3">Custom</p>
                                <p className="text-xs text-muted-soft mt-1">for large distribution teams</p>
                                
                                <ul className="mt-8 space-y-3 text-xs text-muted">
                                    <li className="flex items-center gap-2">✓ Unlimited file size uploads</li>
                                    <li className="flex items-center gap-2">✓ Virtualized tables for large assets</li>
                                    <li className="flex items-center gap-2">✓ Private server deployments</li>
                                    <li className="flex items-center gap-2">✓ Dedicated priority support</li>
                                </ul>
                            </div>

                            <a
                                href="mailto:sales@fileshare.sys"
                                className="rounded-md border border-hairline bg-canvas py-2.5 text-center text-xs font-semibold text-ink hover:bg-surface-soft transition-colors mt-8 select-none focus-visible:ring-2 focus-visible:ring-primary block cursor-pointer"
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pre-Footer CTA Band */}
            <section className="mx-auto max-w-[1200px] px-6 py-20 w-full text-center">
                <div className="rounded-xl bg-surface-card p-12 md:p-16 border border-hairline transition-colors duration-200">
                    <h2 className="font-display font-semibold tracking-tight text-ink text-3xl md:text-4xl mb-4 leading-none">
                        Smarter, simpler file sharing
                    </h2>
                    <p className="text-sm text-muted mb-8 max-w-md mx-auto">
                        Join developers and creative designers in managing and sharing files in a beautiful, minimal digital workspace.
                    </p>
                    <Link
                        to={token ? "/files" : "/register"}
                        className="rounded-md bg-primary px-6 py-3 text-xs font-semibold text-on-primary hover:bg-primary-hover transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-primary cursor-pointer inline-block"
                    >
                        Create Your Workspace
                    </Link>
                </div>
            </section>

            {/* Dark Pre-Footer */}
            <footer className="w-full bg-surface-dark py-16 px-6 text-on-dark-soft border-t border-zinc-800 transition-colors duration-200">
                <div className="mx-auto max-w-[1200px]">
                    {/* Link lists grid */}
                    <div className="grid gap-8 grid-cols-2 md:grid-cols-4 text-left mb-12">
                        <div>
                            <h4 className="text-xs font-bold text-on-dark uppercase tracking-wider mb-4">Product</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><a href="#features" className="hover:text-on-dark transition-colors">Files Explorer</a></li>
                                <li><a href="#mockups" className="hover:text-on-dark transition-colors">Secure Storage</a></li>
                                <li><a href="#sharing" className="hover:text-on-dark transition-colors">Quick Sharing</a></li>
                                <li><a href="#previews" className="hover:text-on-dark transition-colors">Previews Engine</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-on-dark uppercase tracking-wider mb-4">Resources</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><a href="#docs" className="hover:text-on-dark transition-colors">API Docs</a></li>
                                <li><a href="#security" className="hover:text-on-dark transition-colors">Security Audit</a></li>
                                <li><a href="#developer" className="hover:text-on-dark transition-colors">Developer Portal</a></li>
                                <li><a href="#status" className="hover:text-on-dark transition-colors">System Status</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-on-dark uppercase tracking-wider mb-4">Company</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><a href="#about" className="hover:text-on-dark transition-colors">About Us</a></li>
                                <li><a href="#blog" className="hover:text-on-dark transition-colors">Workspace Blog</a></li>
                                <li><a href="#careers" className="hover:text-on-dark transition-colors">Careers</a></li>
                                <li><a href="#press" className="hover:text-on-dark transition-colors">Press Room</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-on-dark uppercase tracking-wider mb-4">Legal</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><a href="#terms" className="hover:text-on-dark transition-colors">Terms of Service</a></li>
                                <li><a href="#privacy" className="hover:text-on-dark transition-colors">Privacy Policy</a></li>
                                <li><a href="#data" className="hover:text-on-dark transition-colors">Data Compliance</a></li>
                                <li><a href="#cookie" className="hover:text-on-dark transition-colors">Cookie Policies</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom wordmark copyright row */}
                    <div className="border-t border-zinc-800/60 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
                        <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-on-dark">
                            Vaultix
                        </span>
                        <p className="text-[11px] text-[#71717a]">
                            &copy; 2026 Vaultix. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
