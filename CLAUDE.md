# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **sdd-starter-pack**: a comprehensive methodology framework and template system for Spec-Driven Development (SDD). It provides:
- Complete templates for software specifications
- AI-friendly prompts and guides
- Real-world examples and workflow documentation
- Support for AI-assisted development with any coding assistant

**Important**: This is a documentation project, not a software project. There are no build processes, tests, or package dependencies.

## Repository Structure

```
cookbook/
├── README.md                 (Master usage guide)
├── playbook/                (Methodology & guides)
│   ├── AI-USAGE-GUIDE.md    (25KB guide for using AI tools with SDD)
│   ├── AI-USAGE-GUIDE-ZH.md (Chinese version)
│   ├── SDD-QUICK-REFERENCE.md
│   ├── SDD-TEMPLATE-PROMPT.md  (Complete AI prompt for generating specs)
│   └── SDD-WORKFLOW-EXAMPLE.md
├── templates/               (Ready-to-use template files)
│   ├── S-00-architecture-template.md
│   ├── S-01-uiux-design-template.md
│   ├── S-02-testing-strategy-template.md
│   ├── S-03-database-schema-template.md
│   └── F-XX-feature-template.md
└── examples/               (Sample implementations)
    └── sample-project-conversion.md
```

## Core Concepts

### File Naming Conventions

- **S-XX-*.md**: System modules (cross-cutting concerns, architectural layers)
  - S-00: Architecture Overview
  - S-01: UI/UX Design System
  - S-02: Testing Strategy
  - S-03+: Database, APIs, etc. (project-specific)
- **F-XX-*.md**: Features (user-facing functionality)

### Mandatory Templates (Required for ALL Projects)

Every project must include these three system specs:

1. **S-00-architecture-template.md** - High-level system design, technology choices, deployment strategy
2. **S-01-uiux-design-template.md** - UI/UX design system (required even for backend-only projects; use placeholder for backend-only)
3. **S-02-testing-strategy-template.md** - Testing approach, test pyramid, coverage goals

All other templates are optional and project-specific.

### Dependency Graph (DAG)

- Specifications follow a Directed Acyclic Graph (DAG) structure
- No circular dependencies allowed
- Dependencies flow: F-XX → S-XX → External
- Numbering reflects implementation waves (lower numbers = higher priority dependencies)

### Progressive Disclosure Pattern

Documentation follows a three-level disclosure:
1. **README.md** - High-level overview and quick start
2. **SDD-QUICK-REFERENCE.md** - One-page cheat sheet
3. **Full specification files** - Complete details

## Common Tasks

### Validating Mermaid Diagrams

Mermaid diagrams are used extensively throughout specs. To validate diagrams:
- Copy the diagram code to https://mermaid.live
- Verify rendering and syntax correctness
- All diagrams should be clear and properly formatted

### Using Templates with AI Tools

1. Users copy templates from `cookbook/templates/`
2. Users modify the template with their project details
3. Users submit to AI tool along with `SDD-TEMPLATE-PROMPT.md`
4. AI generates complete specification set
5. Users review and validate output

### Enhancing Documentation

When modifying guides or templates:
- Maintain bilingual support (English + Chinese where applicable)
- Update version numbers and "Last Updated" dates
- Preserve the progressive disclosure structure
- Keep emphasis on mandatory S-00/S-01/S-02 templates

## Important Conventions

### Version Control

All documents include:
- Version number (e.g., Version 1.1)
- Last Updated date
- Status indicators: ✅ Complete / 🚧 In Progress / ❌ Not Started

### Bilingual Support

Critical guides have parallel documentation:
- `AI-USAGE-GUIDE.md` (English)
- `AI-USAGE-GUIDE-ZH.md` (Chinese Simplified)

Keep both versions in sync when updating.

### Testing Strategy

- Test Pyramid: E2E → Integration → Unit
- Tier 1 Critical Path Tests (block deployment if fail)
- Tests should be embedded in feature specifications

### Documentation Standards

- Use Mermaid diagrams for complex workflows and dependencies
- Include practical examples and real-world scenarios
- Provide troubleshooting sections for common issues
- Link to related documentation for navigation

## Development Workflows

Since this is a documentation project, there are no build, test, or lint commands to run. Work focuses on:

1. **Creating/updating specifications** - Ensure consistency with SDD principles
2. **Maintaining templates** - Keep templates current and well-documented
3. **Updating guides** - Reflect best practices and new patterns
4. **Validating examples** - Ensure example projects remain relevant

## Key References

- **SDD-TEMPLATE-PROMPT.md** - The complete AI prompt used to generate specs (12,000+ words)
- **SDD-WORKFLOW-EXAMPLE.md** - End-to-end example showing "Task Manager" project development
- **AI-USAGE-GUIDE.md** - Practical guide for using AI tools with SDD methodology
- **README-TEMPLATES.md** - Detailed explanation of each template and when to use them

## Project Status

- **Version**: 1.1
- **Status**: Production-ready
- **Last Updated**: 2025-11-28
- **Maturity**: Stable, based on real project implementations
