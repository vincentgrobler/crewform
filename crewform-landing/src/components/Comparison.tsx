import './Comparison.css'

const rows = [
    { feature: 'Open Source', crewform: '✅ AGPL v3', crewai: '✅ MIT', autogen: '✅ CC-BY-4.0', langgraph: '✅ MIT' },
    { feature: 'Visual UI', crewform: '✅ Built-in', crewai: '❌ CLI only', autogen: '❌ Code only', langgraph: '❌ Code only' },
    { feature: 'Self-Hostable', crewform: '✅ Docker', crewai: 'N/A', autogen: 'N/A', langgraph: 'N/A' },
    { feature: 'BYOK (No Markup)', crewform: '✅', crewai: '✅', autogen: '✅', langgraph: '✅' },
    { feature: 'Agent Marketplace', crewform: '✅', crewai: '❌', autogen: '❌', langgraph: '❌' },
    { feature: 'Team Collaboration', crewform: '✅', crewai: '❌', autogen: '❌', langgraph: '❌' },
    { feature: 'Multi-Provider', crewform: '✅', crewai: '✅', autogen: '✅', langgraph: '✅' },
    { feature: 'Language', crewform: 'TypeScript', crewai: 'Python', autogen: 'Python', langgraph: 'Python' },
]

export function Comparison() {
    return (
        <section id="comparison" className="section">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="glow-line" style={{ margin: '0 auto 2rem' }} />
                    <h2 className="section-title">How CrewForm Compares</h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        A UI-first, self-hostable, open-source platform — not just another Python library.
                    </p>
                </div>

                <div className="comparison-table-wrapper">
                    <table className="comparison-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th className="highlight-col">CrewForm</th>
                                <th>crewAI</th>
                                <th>AutoGen</th>
                                <th>LangGraph</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.feature}>
                                    <td className="feature-name">{row.feature}</td>
                                    <td className="highlight-col">{row.crewform}</td>
                                    <td>{row.crewai}</td>
                                    <td>{row.autogen}</td>
                                    <td>{row.langgraph}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <p className="comparison-note">
                    crewAI, AutoGen, and LangGraph are excellent Python libraries. CrewForm is a full-stack platform with a UI — they're complementary, not competitors.
                </p>
            </div>
        </section>
    )
}
