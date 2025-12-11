# Idea War Room

An AI-powered "war room" that uses the Multi-Vector Threat Analysis (MVTA) framework plus online community research to run a red-team simulation on your startup idea and deliver a structured "Damage Report" in one session.

## Project Structure

```
idea-war-room/
├── README.md          # This file - Project overview
├── cookbook/          # SDD methodology framework (templates and guides)
└── specs/             # All project specifications
    ├── README.md      # Start here - Complete navigation guide
    ├── system/        # System design modules (S-00 to S-05)
    ├── features/      # Feature specifications (F-01 to F-09)
    └── original/      # Original project requirements
```

## Getting Started

**For specifications and development guide:**
→ Read [specs/README.md](./specs/README.md)

This is where all product requirements, technical specifications, and implementation guides are located.

## What is Idea War Room?

Idea War Room helps founders stress-test their startup ideas through professional-grade Multi-Vector Threat Analysis (MVTA). In a single 30-45 minute session, founders receive:

- **Structured Idea Analysis**: Converts raw ideas into MVTA framework format
- **Evidence-Backed Research**: Real-world data from Reddit, forums, competitors, reviews
- **AI Red Team Simulation**: 5 adversarial personas attacking across 18+ threat vectors
- **Vulnerability Scoring**: 1-5 scale ratings (catastrophic to resilient)
- **Cascading Failure Detection**: Identifies chain reactions that could kill the business
- **Actionable Recommendations**: Specific next steps for validation and mitigation

**Target Users**: Early-stage founders, indie hackers, accelerator applicants, student teams, strategy professionals

## Key Features

- **MVTA Idea Intake** - Conversational form mapping to Multi-Vector Threat Analysis structure
- **Online Research Engine** - Automated competitor analysis and community listening
- **Red Team Simulation** - 5 AI personas (Penetration Tester, Competitor CEO, Social Critic, Regulatory Officer, Political Strategist)
- **Damage Report Generator** - Structured vulnerability analysis with executive summary
- **Interactive Q&A** - Follow-up questions grounded in damage report context
- **Session History** - Save and compare multiple idea analyses
- **Export & Sharing** - Copy markdown reports for pitches and documentation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes, TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **LLM Provider**: AI Builders API (https://space.ai-builders.com/backend/openapi.json)
- **Search Provider**: AI Builders API
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: TBD (will be defined later)

## Quick Links

- **Complete Specifications** → [specs/README.md](./specs/README.md)
- **System Architecture** → [specs/system/S-00-architecture.md](./specs/system/S-00-architecture.md)
- **UI/UX Design System** → [specs/system/S-01-uiux-design.md](./specs/system/S-01-uiux-design.md)
- **Database Schema** → [specs/system/S-03-database-schema.md](./specs/system/S-03-database-schema.md)
- **LLM Integration** → [specs/system/S-04-llm-integration.md](./specs/system/S-04-llm-integration.md)
- **All Features** → [specs/features/](./specs/features/)

## Development Approach

This project follows **Spec-Driven Development (SDD)** methodology:

1. **Read specs/README.md** for navigation guide
2. **Start with S-00 Architecture** for system overview
3. **Review system modules (S-01 to S-05)** for cross-cutting concerns
4. **Implement features by waves** following dependency graph
5. **Update status checkboxes** as you progress

### Implementation Waves

- **Wave 1**: F-01 (Database & Auth)
- **Wave 2**: F-02 (Idea Intake), F-03 (Research Engine)
- **Wave 3**: F-04 (MVTA Red Team Simulation)
- **Wave 4**: F-05 (Damage Report Display), F-09 (Session History)
- **Wave 5**: F-06 (Interactive Q&A), F-07 (Export), F-08 (Feedback)

## Methodology

This project uses the **SDD Starter Pack** methodology and templates located in `/cookbook/`. Key resources:

- **AI Usage Guide**: `/cookbook/playbook/AI-USAGE-GUIDE.md`
- **SDD Quick Reference**: `/cookbook/playbook/SDD-QUICK-REFERENCE.md`
- **Templates**: `/cookbook/templates/`

---

**Status**: Specifications Complete - Ready for Development
**Version**: 1.0
**Last Updated**: 2025-12-08
