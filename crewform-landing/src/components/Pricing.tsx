import './Pricing.css'

const plans = [
    {
        name: 'Open Source',
        price: 'Free',
        period: 'forever',
        description: 'Self-host on your own infrastructure',
        features: [
            'Unlimited agents & teams',
            'All LLM providers',
            'Pipeline team execution',
            'Full analytics dashboard',
            'Docker self-hosting',
            'Community support',
            'AGPL v3 license',
        ],
        cta: 'Self-Host Free',
        ctaHref: 'https://github.com/vincentgrobler/crewform',
        highlighted: false,
    },
    {
        name: 'Cloud Beta',
        price: '$0',
        period: '/month during beta',
        description: 'Hosted version — no infrastructure to manage',
        features: [
            'Everything in Open Source',
            'Managed hosting',
            'Automatic updates',
            'Agent marketplace access',
            'Priority support',
            'No Docker required',
            'Free during beta',
        ],
        cta: 'Start Free Beta →',
        ctaHref: 'https://crewform.vercel.app/',
        highlighted: true,
    },
    {
        name: 'Pro',
        price: 'TBD',
        period: '/month',
        description: 'For teams and power users',
        features: [
            'Everything in Cloud',
            'Team workspaces',
            'Orchestrator mode',
            'Webhook integrations',
            'Advanced analytics',
            'Priority queue',
            'SLA support',
        ],
        cta: 'Coming in Phase 2',
        ctaHref: '#',
        highlighted: false,
        disabled: true,
    },
]

export function Pricing() {
    return (
        <section id="pricing" className="section">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="glow-line" style={{ margin: '0 auto 2rem' }} />
                    <h2 className="section-title">Simple, transparent pricing</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Open-source and free to self-host. Cloud beta is free too. No surprises.
                    </p>
                </div>

                <div className="pricing-grid">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`card pricing-card ${plan.highlighted ? 'pricing-highlighted' : ''}`}>
                            {plan.highlighted && <div className="pricing-badge">Most Popular</div>}
                            <h3 className="pricing-name">{plan.name}</h3>
                            <div className="pricing-price">
                                <span className="pricing-amount">{plan.price}</span>
                                <span className="pricing-period">{plan.period}</span>
                            </div>
                            <p className="pricing-description">{plan.description}</p>
                            <ul className="pricing-features">
                                {plan.features.map((feature) => (
                                    <li key={feature}>
                                        <span className="pricing-check">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <a
                                href={plan.disabled ? undefined : plan.ctaHref}
                                className={`pricing-cta ${plan.highlighted ? 'btn-primary' : 'btn-secondary'} ${plan.disabled ? 'pricing-disabled' : ''}`}
                                target={plan.ctaHref.startsWith('http') ? '_blank' : undefined}
                                rel={plan.ctaHref.startsWith('http') ? 'noopener' : undefined}
                            >
                                {plan.cta}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
