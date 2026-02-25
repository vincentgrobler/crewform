import './Hero.css'

export function Hero() {
    return (
        <section className="hero section">
            {/* Background glow effects */}
            <div className="hero-glow hero-glow-1" />
            <div className="hero-glow hero-glow-2" />

            <div className="container hero-content">
                <span className="badge">
                    <span style={{ color: 'var(--green)' }}>●</span> Now in Beta
                </span>

                <h1 className="hero-title">
                    Form Your <span className="gradient-text">AI Crew</span>
                </h1>

                <p className="hero-subtitle">
                    Open-source multi-agent orchestration platform.
                    Deploy, manage, and chain AI agents through a visual UI —
                    with your own API keys, on your own infrastructure.
                </p>

                <div className="hero-actions">
                    <a href="https://crewform.vercel.app/" className="btn-primary animate-pulse-glow">
                        Get Started Free →
                    </a>
                    <a href="https://github.com/vincentgrobler/crewform" target="_blank" rel="noopener" className="btn-secondary">
                        ⭐ Star on GitHub
                    </a>
                </div>

                <div className="hero-stats">
                    <div className="hero-stat">
                        <span className="hero-stat-value">3</span>
                        <span className="hero-stat-label">LLM Providers</span>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <span className="hero-stat-value">BYOK</span>
                        <span className="hero-stat-label">Zero Markup</span>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <span className="hero-stat-value">AGPL v3</span>
                        <span className="hero-stat-label">Open Source</span>
                    </div>
                    <div className="hero-stat-divider" />
                    <div className="hero-stat">
                        <span className="hero-stat-value">1-Click</span>
                        <span className="hero-stat-label">Self-Host</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
