import './Navbar.css'

export function Navbar() {
    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                <a href="/" className="navbar-logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">CrewForm</span>
                </a>

                <div className="navbar-links">
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How It Works</a>
                    <a href="#comparison">Compare</a>
                    <a href="#pricing">Pricing</a>
                    <a href="https://github.com/vincentgrobler/crewform" target="_blank" rel="noopener">
                        GitHub
                    </a>
                </div>

                <div className="navbar-actions">
                    <a href="https://discord.gg/NpcWr9d7" target="_blank" rel="noopener" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Discord
                    </a>
                    <a href="https://crewform.vercel.app/" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                        Launch App →
                    </a>
                </div>
            </div>
        </nav>
    )
}
