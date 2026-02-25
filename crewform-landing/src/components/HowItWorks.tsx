import './HowItWorks.css'

const steps = [
    {
        number: '01',
        title: 'Create Agents',
        description: 'Pick a model (Claude, Gemini, GPT), write a system prompt, and configure behavior. Each agent is a specialist.',
        color: 'var(--brand)',
    },
    {
        number: '02',
        title: 'Build Teams',
        description: 'Chain agents into Pipeline Teams. Define the sequence, instructions per step, and failure handling (retry, stop, skip).',
        color: 'var(--blue)',
    },
    {
        number: '03',
        title: 'Run Tasks',
        description: 'Submit a task and watch your team execute in real-time. Each agent processes its step, passing output to the next.',
        color: 'var(--green)',
    },
    {
        number: '04',
        title: 'Monitor & Optimize',
        description: 'Track token usage, costs, and performance on the Analytics dashboard. Identify bottlenecks and optimize your workflows.',
        color: 'var(--amber)',
    },
]

export function HowItWorks() {
    return (
        <section id="how-it-works" className="section">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div className="glow-line" style={{ margin: '0 auto 2rem' }} />
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        From zero to multi-agent workflow in minutes.
                    </p>
                </div>

                <div className="steps-grid">
                    {steps.map((step, i) => (
                        <div key={step.number} className="step-card">
                            <div className="step-number" style={{ color: step.color }}>{step.number}</div>
                            <h3 className="step-title">{step.title}</h3>
                            <p className="step-description">{step.description}</p>
                            {i < steps.length - 1 && <div className="step-connector" />}
                        </div>
                    ))}
                </div>

                {/* Architecture diagram */}
                <div className="architecture-card card" style={{ marginTop: '4rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Architecture
                    </h3>
                    <pre className="architecture-diagram">{`
┌─────────────────────────────────────────────────┐
│                   CrewForm UI                    │
│          React + TypeScript + Tailwind           │
├─────────────────────────────────────────────────┤
│                  Supabase Layer                  │
│     Auth · Database · Realtime · Storage         │
├─────────────────────────────────────────────────┤
│                  Task Runner                     │
│      Node.js · Multi-Provider LLM Support        │
│     (Anthropic · Google · OpenAI · More)         │
├─────────────────────────────────────────────────┤
│              Your LLM Providers                  │
│           (BYOK — Your Keys, Your Cost)          │
└─────────────────────────────────────────────────┘`}</pre>
                </div>
            </div>
        </section>
    )
}
