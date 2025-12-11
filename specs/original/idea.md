【请使用/cookbook/playbook/SDD-TEMPLATE-PROMPT.md作为模版系统，为我的项目完成specification
文档（放在specs文件夹里）。文档和软件都使用英文。】

Project Name: Idea War Room (MVP: MVTA Red Team)

Project Description: An AI “war room” that uses the Multi-Vector Threat Analysis (MVTA) framework plus online community research (Reddit, forums, reviews, social groups) to run a red-team simulation on your startup idea and deliver a structured “Damage Report” in one session.

Problem: Founders rarely get structured, multi-angle, evidence-backed pushback on new ideas. Most AI chats are “yes-men,” and human feedback is ad hoc, slow, and rarely grounded in real user conversations or systematic threat analysis.

Solution: Wrap the MVTA framework into an interactive war room: the system guides founders to define their idea, then simulates a professional Red Team (penetration tester, competitor CEO, social critic, regulator, political strategist). It pulls in online community and market research, runs attack simulations across all MVTA vectors, scores vulnerabilities, identifies cascading failure chains, and returns a clear Damage Report with next steps.

Target Users:
- Early-stage founders and indie hackers with new product ideas
- Solo builders and small teams pre-MVP or pre-launch
- Accelerator applicants, student teams, and innovators preparing pitches or capstone projects
- Strategy / product folks exploring new features or GTM bets

Usage Scenarios:
- Before starting to build, a founder runs an MVTA War Room session to see whether their idea survives multi-vector attacks and real user feedback.
- While preparing a pitch or accelerator application, a team uses the Damage Report to strengthen their “risks & mitigations” section.
- A builder tests multiple ideas in parallel and compares Damage Reports (which idea has fewer catastrophic chains and more manageable risks?).

Core Features:
1. MVTA “Target Idea” Intake (Step 1)
  Conversational intake that maps directly to the MVTA structure:
    - High concept (one-sentence description)
    - Value proposition (problem + for whom)
    - 12–18 month success metric
    - Key assumptions split into: Market, Technical/Operational, Business Model
    - Assets & environment: key assets, narrative strengths, target ecosystem (user persona, competitive landscape, regulatory context)
2. Online Research & Community Listening Layer
  Automatic research pass that looks for:
    - Competitors and similar tools (websites, pricing pages, docs)
    - User conversations in online communities (Reddit, forums, Q&A sites, reviews, relevant public groups) about:
        1) The problem space
        2) Similar products (pain points / love / churn reasons)
        3) Unmet needs (“I wish there was a tool that…”) and already-satisfied needs
        4) Output is a concise “Research & Community Snapshot” fed into MVTA.
3. Red Team Simulation (Roles & Vectors – Step 3)
  Use MVTA’s Red Team roles as AI personas:
    - Lead Penetration Tester → Technical & Product Integrity
    - Ruthless Competitor CEO → Market & Economic Viability
    - Skeptical Social Critic → Social & Ethical Resonance
    - Cynical Regulatory Officer → Legal & Regulatory Compliance
    - Master Political Strategist → Narrative & Political Weaponization
        Each persona runs relevant MVTA attack simulations (scalability, supply chain poisoning, cancel culture simulation, weaponized litigation, malicious reframing, etc.) using both idea definition and research snapshot.
4. Multi-Vector Threat Scoring (Step 2)
    Every identified vulnerability is scored using the MVTA 1–5 scale:
        1 = Catastrophic (kill shot)
        2 = Critical (requires fundamental pivot)
        3 = Significant
        4 = Moderate
        5 = Resilient
    The system ranks the 3–5 most dangerous vulnerabilities and highlights any 1–2 score items.
5. Damage Report Generator (Step 4)
  Structured Damage Report output that mirrors the MVTA format:
    - Executive Summary: 3–5 most critical vulnerabilities + any catastrophic cascading failures.
    - Vector Analysis Tables: For each vector, a table like:
        1) Attack Simulation
        2) Vulnerability Description
        3) Score (1–5)
        4) Rationale (grounded in idea + research/community evidence)
    - Vector Synthesis: Short resilience summary per vector.
    - Cascading Failures: Narrative of the most dangerous failure chains (e.g., “Supply chain issue → customer harm → public backlash → litigation → value proposition collapse”).
6. Next-Step Recommendations
    For each critical / catastrophic vulnerability, 1–2 suggested mitigation or validation actions (e.g., discovery interview plan, pricing experiments, feasibility spike, compliance consultation, narrative reframing tests).
7. In-Session Follow-Up Q&A
    After the Damage Report is shown, the user can ask follow-up questions in the same War Room chat (“How can I reduce this risk?”, “What should I validate first?”), and the system responds using the MVTA context and research snapshot.
8. Copy/Export Damage Report
    One-click to copy a structured report (e.g., markdown or bullet-friendly format) for Notion, Google Docs, pitch decks, or internal review.
9. Light Feedback & Iteration Hooks
    Quick feedback prompt (“Did this capture your real risks?” + optional note) to tune prompts, research strategies, and scoring.

Key Business Logic:
1. Prompt A：结构化 Idea
    System Prompt: 
        You are an assistant that converts messy founder answers into a clean JSON schema for the Multi-Vector Threat Analysis (MVTA) framework.
        - Do not invent facts.
        - If a field is missing, use an empty string or empty array.
        - Output ONLY valid JSON, matching the provided schema.
    User Prompt
        Here are the founder's answers to several questions about their idea:
        [RAW_ANSWERS]
        Convert them into the following JSON schema:
        {
            "high_concept": "",
            "value_proposition": "",
            "success_metric_18m": "",
            "assumptions": {
                "market": [],
                "technical": [],
                "business_model": []
        },
        "assets": {
            "key_assets": [],
            "brand_narrative": []
        },
        "environment": {
            "user_persona": "",
            "competitive_landscape": "",
            "regulatory_context": ""
        }
        }
2. 生成 Research Queries
    System Prompt:
        You generate focused web search queries for startup idea research.
        Goals:
            - Find similar products and competitors.
            - Find user conversations in online communities (e.g. Reddit, forums, reviews).
            - Surface unmet needs and already satisfied needs.
            - Optionally surface relevant regulatory/ethical context.
        Return a JSON object with three arrays:
            - competitor_queries[]
            - community_queries[]
            - regulatory_queries[]
    User Prompt:
        Here is the MVTA idea schema:
        [IDEA_SCHEMA_JSON]
        Generate 3-5 search queries for each category:
            - competitor_queries: to find similar tools and competitors.
            - community_queries: to find user discussions, complaints, reviews, unmet needs.
            - regulatory_queries: only if domain appears sensitive (health, finance, kids, etc).
        Output valid JSON:
        {
            "competitor_queries": [],
            "community_queries": [],
            "regulatory_queries": []
        }
3. MVTA Red Team 主分析 Prompt
    System Prompt:
        You are an AI Red Team conducting a Multi-Vector Threat Analysis (MVTA) on a startup idea inside an "Idea War Room."
        Your job:
            - Simulate attacks from 5 roles:
                1) Lead Penetration Tester (Technical & Product Integrity)
                2) Ruthless Competitor CEO (Market & Economic Viability)
                3) Skeptical Social Critic (Social & Ethical Resonance)
                4) Cynical Regulatory Officer (Legal & Regulatory Compliance)
                5) Master Political Strategist (Narrative & Political Weaponization)
            - Use the following attack simulations per vector:
                Technical & Product Integrity:
            - Scalability Stress Test
            - Supply Chain Poisoning
            - Usability Failure
            - Systemic Fragility
        Market & Economic Viability:
            - Competitor War Game
            - Value Proposition Collapse
            - Customer Apathy Analysis
            - Channel Extinction Event
        Social & Ethical Resonance:
            - Weaponized Misuse Case
            - Cancel Culture Simulation
            - Ethical Slippery Slope
            - Virtue Signal Hijacking
        Legal & Regulatory Compliance:
            - Loophole Closing
            - Weaponized Litigation
            - Cross-Jurisdictional Conflict
        Narrative & Political Weaponization:
            - Malicious Re-framing
            - Guilt-by-Association
            - Straw Man Construction
        Rules of engagement:
            - Assume worst-case PLAUSIBLE attacks (no science fiction).
            - No hedging: be direct and unambiguous.
            - Mandatory scoring: every vulnerability uses this scale:
                1 = Catastrophic (kill shot, unrecoverable)
                2 = Critical (requires fundamental pivot)
                3 = Significant
                4 = Moderate
                5 = Resilient (negligible threat)
            - Follow the exact JSON format requested.
            - Identify cascading failures where one attack triggers others.
        Ground your reasoning in:
            - The idea schema.
            - Research snapshot (competitors, community signals, regulatory context).
        If research is weak or missing, say so explicitly in the rationale.
        Return ONLY valid JSON.

    User Prompt:
        Here is the startup idea in MVTA schema:
        [IDEA_SCHEMA_JSON]
        Here is the research snapshot (competitors, community signals, regulatory signals):
        [RESEARCH_SNAPSHOT_JSON]
        Now perform a Multi-Vector Threat Analysis (MVTA) and output a JSON object with the following structure:
        {
            "vulnerabilities": [
            {
                "vector": "Market & Economic Viability",
                "simulation": "Competitor War Game",
                "description": "",
                "score": 1,
                "rationale": "",
                "evidence_refs": {
                "competitors": [0],
                "community_signals": ["user_pain_points[1]"],
                "regulatory_signals": []
                }
            }
            ],
            "cascading_failures": [
            {
                "chain": [],
                "severity": 1,
                "narrative": ""
            }
            ],
            "vector_synthesis": [
            {
                "vector": "",
                "summary": "",
                "overall_score": 3
            }
            ],
            "recommendations": [
            {
                "risk_index": 0,
                "action_type": "",
                "description": ""
            }
            ]
        }
        Important:
            - You don't need to use every simulation, but you MUST cover all 5 vectors.
            - "risk_index" in recommendations refers to the index in the vulnerabilities array.
            - "action_type" should be one of:
                "Customer Discovery", "Pricing Experiment", "Technical Spike",
                "Compliance Review", "Narrative Test", "Other".


UI Product Format: 
  - Responsive web app, desktop-first.

UI Design: 
  - 参考网站solopreneur.global，与其风格保持一致；
  - 整个网站使用英文

Tech Stack: 
  - use suggested stack
  - LLM: please use ai-builders API https://space.ai-builders.com/backend/openapi.json
  - Search: please use ai-builders API https://space.ai-builders.com/backend/openapi.json

Deployment: 
  - will define it later