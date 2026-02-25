import './Footer.css'

const links = {
    Product: [
        { label: 'Launch App', href: 'https://crewform.vercel.app/' },
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Compare', href: '#comparison' },
    ],
    Resources: [
        { label: 'Documentation', href: 'https://github.com/vincentgrobler/crewform/tree/main/docs' },
        { label: 'Quick Start', href: 'https://github.com/vincentgrobler/crewform/blob/main/docs/quickstart.md' },
        { label: 'API Reference', href: 'https://github.com/vincentgrobler/crewform/blob/main/docs/api-reference.md' },
        { label: 'Self-Hosting', href: 'https://github.com/vincentgrobler/crewform/blob/main/docs/self-hosting.md' },
    ],
    Community: [
        { label: 'GitHub', href: 'https://github.com/vincentgrobler/crewform' },
        { label: 'Discord', href: 'https://discord.gg/NpcWr9d7' },
        { label: 'Twitter/X', href: 'https://twitter.com/CrewForm' },
        { label: 'Contributing', href: 'https://github.com/vincentgrobler/crewform/blob/main/CONTRIBUTING.md' },
    ],
}

export function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <img src="/crewform-icon.png" alt="CrewForm" style={{ width: '28px', height: '28px' }} />
                            <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>CrewForm</span>
                        </div>
                        <p className="footer-tagline">
                            Open-source AI agent orchestration.
                            Form your AI crew.
                        </p>
                        <p className="footer-license">
                            Licensed under AGPL v3
                        </p>
                    </div>

                    {/* Link columns */}
                    {Object.entries(links).map(([category, items]) => (
                        <div key={category} className="footer-col">
                            <h4 className="footer-col-title">{category}</h4>
                            <ul className="footer-col-links">
                                {items.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            target={link.href.startsWith('http') ? '_blank' : undefined}
                                            rel={link.href.startsWith('http') ? 'noopener' : undefined}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="footer-bottom">
                    <p>© {new Date().getFullYear()} CrewForm. All rights reserved.</p>
                    <p>
                        Made with ❤️ for the AI community
                    </p>
                </div>
            </div>
        </footer>
    )
}
