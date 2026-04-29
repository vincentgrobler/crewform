-- ─────────────────────────────────────────────────────────────────────────────
-- CrewForm — Research Crew Seed Data
-- Inserts 3 demo agents and a pipeline team for the Research Crew use case.
-- Used by docker-compose.research-crew.yml to pre-configure a workspace.
-- ─────────────────────────────────────────────────────────────────────────────

-- Skip if already seeded (idempotent)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM agents WHERE name = 'Researcher' AND tags @> ARRAY['research-crew']) THEN
        RAISE NOTICE 'Research Crew already seeded — skipping';
        RETURN;
    END IF;

    -- ── 1. Find the default workspace ────────────────────────────────────
    -- Uses the first workspace. For multi-tenant setups, change this query.
    DECLARE
        v_workspace_id UUID;
        v_researcher_id UUID;
        v_analyst_id UUID;
        v_writer_id UUID;
        v_team_id UUID;
    BEGIN
        SELECT id INTO v_workspace_id FROM workspaces ORDER BY created_at LIMIT 1;

        IF v_workspace_id IS NULL THEN
            RAISE NOTICE 'No workspace found — skipping Research Crew seed';
            RETURN;
        END IF;

        -- ── 2. Insert 3 Research Crew agents ─────────────────────────────
        INSERT INTO agents (workspace_id, name, description, model, provider, system_prompt, temperature, max_tokens, tags, tools)
        VALUES (
            v_workspace_id,
            'Researcher',
            'Expert researcher that gathers comprehensive information, finds sources, and builds a structured knowledge base on any topic.',
            'gpt-4o-mini',
            'openai',
            'You are a thorough researcher. Your task is to gather comprehensive information about the given topic.

Research guidelines:
- Find current, relevant information and data points
- Identify key trends, statistics, and expert opinions
- Note any controversies or differing viewpoints
- Gather real-world examples and case studies
- Search the knowledge base for any relevant internal documents

Output a structured research brief with:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points with sources)
3. Detailed Analysis (organized by subtopic)
4. Knowledge Gaps (what needs further investigation)',
            0.3,
            NULL,
            ARRAY['research-crew'],
            ARRAY['web_search', 'knowledge_search']
        ) RETURNING id INTO v_researcher_id;

        INSERT INTO agents (workspace_id, name, description, model, provider, system_prompt, temperature, max_tokens, tags, tools)
        VALUES (
            v_workspace_id,
            'Analyst',
            'Analytical thinker that extracts key insights from research, identifies patterns, and creates structured content outlines.',
            'gpt-4o-mini',
            'openai',
            'You are an analytical thinker. Given research findings, your job is to:

1. Identify the most important insights and trends
2. Find connections between data points that aren''t immediately obvious
3. Prioritise findings by relevance and impact
4. Create a clear narrative structure for the final content
5. Highlight any contradictions or gaps in the research

Output a structured analysis with:
- Prioritised Insights (ranked by importance)
- Key Patterns & Connections
- Recommended Content Outline
- Suggested Data Visualizations
- Open Questions for further research',
            0.4,
            NULL,
            ARRAY['research-crew'],
            ARRAY[]::text[]
        ) RETURNING id INTO v_analyst_id;

        INSERT INTO agents (workspace_id, name, description, model, provider, system_prompt, temperature, max_tokens, tags, tools)
        VALUES (
            v_workspace_id,
            'Writer',
            'Professional content writer that transforms research and analysis into polished, publication-ready articles and reports.',
            'gpt-4o-mini',
            'openai',
            'You are a skilled content writer. Using the research and analysis provided, write a compelling, publication-ready piece.

Writing guidelines:
- Write in a professional but accessible tone
- Include data points and examples from the research
- Use clear headings and subheadings
- Write an engaging introduction that hooks the reader
- End with a strong conclusion and key takeaways
- Aim for 1,500-2,000 words
- Use markdown formatting

Structure:
1. Title
2. Introduction (hook + thesis)
3. Body sections (3-5 sections, each with a clear point)
4. Conclusion (key takeaways + next steps)

Produce publication-ready content in markdown format.',
            0.7,
            NULL,
            ARRAY['research-crew'],
            ARRAY[]::text[]
        ) RETURNING id INTO v_writer_id;

        -- ── 3. Create the pipeline team ──────────────────────────────────
        INSERT INTO teams (workspace_id, name, description, mode, config)
        VALUES (
            v_workspace_id,
            'Research Crew',
            'End-to-end research pipeline: Researcher → Analyst → Writer. Give it a topic and get a polished article.',
            'pipeline',
            jsonb_build_object(
                'steps', jsonb_build_array(
                    jsonb_build_object(
                        'agent_id', v_researcher_id,
                        'step_name', 'Research',
                        'instructions', 'Gather comprehensive information on the given topic. Search the knowledge base and the web.',
                        'expected_output', 'Structured research brief with key findings and sources',
                        'on_failure', 'retry',
                        'max_retries', 1
                    ),
                    jsonb_build_object(
                        'agent_id', v_analyst_id,
                        'step_name', 'Analyse',
                        'instructions', 'Analyse the research findings. Extract key insights, identify patterns, and create a content outline.',
                        'expected_output', 'Prioritised insights and recommended content structure',
                        'on_failure', 'retry',
                        'max_retries', 1
                    ),
                    jsonb_build_object(
                        'agent_id', v_writer_id,
                        'step_name', 'Write',
                        'instructions', 'Write a polished, publication-ready article using the research and analysis.',
                        'expected_output', 'Publication-ready article in markdown format',
                        'on_failure', 'stop',
                        'max_retries', 0
                    )
                ),
                'auto_handoff', true
            )
        ) RETURNING id INTO v_team_id;

        -- ── 4. Add team members ──────────────────────────────────────────
        INSERT INTO team_members (team_id, agent_id, role, position)
        VALUES
            (v_team_id, v_researcher_id, 'worker', 0),
            (v_team_id, v_analyst_id, 'worker', 1),
            (v_team_id, v_writer_id, 'worker', 2);

        RAISE NOTICE 'Research Crew seeded successfully — 3 agents + 1 pipeline team';
    END;
END $$;
