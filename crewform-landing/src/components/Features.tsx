import './Features.css'

const features = [
    {
        icon: '🤖',
        title: 'Visual Agent Builder',
        description: 'Create and configure AI agents from a UI — pick a model, write a system prompt, set temperature. No boilerplate.',
        accent: 'var(--brand)',
    },
    {
        icon: '👥',
        title: 'Pipeline Teams',
        description: 'Chain agents sequentially. Research → Write → Edit. Each step gets the previous output with configurable failure handling.',
        accent: 'var(--blue)',
    },
    {
        icon: '🔑',
        title: 'BYOK — Zero Markup',
        description: 'Bring Your Own Key. Connect Anthropic, Google, or OpenAI directly. You pay your provider at standard rates. Zero middleman.',
        accent: 'var(--green)',
    },
    {
        icon: '🏪',
        title: 'Agent Marketplace',
        description: 'Share and discover agent templates built by the community. Install pre-built agents in one click. Free and premium options.',
        accent: 'var(--amber)',
    },
    {
        icon: '🏠',
        title: 'Self-Hostable',
        description: 'Run on your own infrastructure with Docker Compose. PostgreSQL, nginx, task runner — all configured out of the box.',
        accent: 'var(--cyan)',
    },
    {
        icon: '🔒',
        title: 'Secure by Default',
        description: 'AES-256-GCM key encryption. Row-Level Security on every table. HTTPS only. Your data stays yours.',
        accent: 'var(--red)',
    },
    {
        icon: '📊',
        title: 'Usage & Analytics',
        description: 'Monitor token usage, costs, and performance per agent. Visualize status distribution, top models, and cost trends.',
        accent: 'var(--brand-light)',
    },
    {
        icon: '⚡',
        title: 'Real-Time Execution',
        description: 'Watch agents work in real-time. Live task updates, step-by-step pipeline progress, and instant error feedback.',
        accent: 'var(--cyan)',
    },
]

export function Features() {
    return (
        <section id="features" className="section">
            <div className="container">
                <div className="features-header">
                    <div className="glow-line" />
                    <h2 className="section-title">Everything you need to orchestrate AI agents</h2>
                    <p className="section-subtitle">
                        A complete platform for building, deploying, and monitoring multi-agent AI workflows.
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature) => (
                        <div key={feature.title} className="card feature-card">
                            <div className="feature-icon" style={{ background: `${feature.accent}15`, color: feature.accent }}>
                                {feature.icon}
                            </div>
                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
