# F-03: Idea Analysis Choice Page

**Version**: 1.0
**Last Updated**: 2025-12-11
**Priority**: CRITICAL
**Status**: ✅ Spec Complete (NEW - branching workflow)

---

## Quick Reference

**What**: Post-intake branching page where users choose between MVTA Analysis or Online Research. Displays idea summary and two independent action buttons.

**Why**: Supports flexible workflow - users can skip research and go straight to MVTA, or do research first, or do both in any order.

**Status**: Core feature (implements branching workflow architecture)

**Dependencies**:
- F-01: Database & Authentication (session management)
- F-02: Idea Intake Form (provides idea data)
- S-03: Database Schema (sessions table with completion flags)

**Used By**:
- F-04: MVTA Red Team Simulation (receives user selection)
- F-08: Research Engine (receives user selection)

**Implementation Status**:
- [x] PRD documented
- [ ] Technical design complete
- [ ] Tests defined
- [ ] Implementation started
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Deployed to production

---

## Dependencies

### Required Features
- [F-01: Database & Authentication](./F-01-database-auth.md) - Session management
- [F-02: Idea Intake Form](./F-02-idea-intake-form.md) - Structured idea data

### Required System Modules
- [S-03: Database Schema](../system/S-03-database-schema.md) - Sessions table with completion flags

### External Services
- None (internal navigation page)

---

## PRD: Product Requirements

### Overview

The Idea Analysis Choice Page is the central hub of the branching workflow. After users complete the intake form (F-02), they land on this page where they can:
1. **View their idea summary** - Quick recap of what they submitted
2. **Choose next action** - Independent selection between MVTA Analysis or Online Research
3. **Track progress** - See which analyses have been completed
4. **Access results** - Navigate to damage report when MVTA is complete

**Key Design Goal**: Give users control over their analysis path instead of forcing a linear workflow.

---

### User Flow

**Entry**: User completes F-02 Intake Form
- System: Updates session status to 'choice'
- System: Navigates to `/analyze/[sessionId]/choice`
- User: Sees Choice Page with idea summary and action buttons

**Scenario 1: Skip Research**
- User: Clicks "Start MVTA Analysis" button
- System: Navigates to `/analyze/[sessionId]/analysis` (F-04)
- [F-04 executes MVTA without research data]
- System: Navigates directly to Damage Report page (F-05)
- User: Views damage report, can click "Back to Idea Choice" to return

**Scenario 2: Research First**
- User: Clicks "Start Research" button
- System: Navigates to `/analyze/[sessionId]/research` (F-08)
- [F-08 executes research]
- System: Returns to Choice Page
- User: Sees Research badge as "Completed", MVTA button becomes highlighted
- User: Clicks "Start MVTA Analysis"
- [F-04 executes MVTA - NOTE: MVTA does NOT use research data per requirements]
- System: Navigates directly to Damage Report page (F-05)
- User: Views damage report, can click "Back to Idea Choice" to return and see both badges as "Completed"

**Scenario 3: After Completion**
- User: Has completed Research and/or MVTA
- Research button: Shows "Research Completed" and is disabled (cannot re-run)
- MVTA button: Shows "MVTA Analysis" and navigates to report when clicked

---

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  IDEA SUMMARY                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  High Concept: ...                               │  │
│  │  Value Proposition: ...                          │  │
│  │  Success Metric: ...                             │  │
│  │                                                   │  │
│  │  [ ▼ Show Full Details ]                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  CHOOSE YOUR NEXT STEP                                 │
│  ┌──────────────────────┐   ┌──────────────────────┐  │
│  │  🛡️ MVTA ANALYSIS    │   │  🔍 ONLINE RESEARCH  │  │
│  │                       │   │                       │  │
│  │  Simulate adversarial │   │  Gather competitive  │  │
│  │  attacks on your idea │   │  intelligence and    │  │
│  │                       │   │  market signals      │  │
│  │                       │   │                       │  │
│  │  [Not Started]        │   │  [Not Started]       │  │
│  │                       │   │                       │  │
│  │  [MVTA Analysis]      │   │  [Start Research]    │  │
│  │  [🔄 Re-run] (if done)│   │                       │  │
│  └──────────────────────┘   └──────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### UI Components

**Component 1: IdeaSummary**
- **Location**: Upper half of page
- **Default State**: Shows only Step 1 fields:
  - high_concept
  - value_proposition
  - success_metric_18m
- **Expanded State**: Shows all intake fields from all 3 steps:
  - Step 1: High concept, value prop, success metric
  - Step 2: User persona, competitive landscape, regulatory environment
  - Step 3: Assumptions (market, technical, business model), existing assets
- **Interaction**: "Show Full Details" button toggles expansion
- **Styling**: Clean card design, uses same field labels as intake wizard

**Component 2: ActionButtons**
- **Location**: Lower half of page
- **Layout**: Two large cards side-by-side (responsive: stack on mobile)
- **Each Card Contains**:
  - Icon (shield for MVTA, magnifying glass for Research)
  - Title
  - Description (1-2 sentences)
  - Status badge (visual indicator: Not Started / Completed)
  - **Main action button**

**MVTA Button Behavior (Smart Button)**:
- **Button Label**:
  - When `analysis_completed = false` → "**Start Analysis**"
  - When `analysis_completed = true` → "**Review Report**"
- **Click Action**:
  - When `analysis_completed = false` → Navigate to analysis page (run analysis)
  - When `analysis_completed = true` → Navigate to report page (view results)
- **No Re-run**: Once completed, can only view report (re-run feature moved to future version)

**Research Button Behavior**:
- **Button Label**:
  - When `research_completed = false` → "Start Research"
  - When `research_completed = true` → "Research Completed"
- **Click Action**:
  - When not completed → Navigate to research page
  - When completed → Disabled (no re-run in MVP)

**Button States Table**:

| research_completed | analysis_completed | Research Button | MVTA Button |
|-------------------|-------------------|----------------|-------------|
| false | false | "Start Research" (enabled) | "Start Analysis" → run |
| true | false | "Research Completed" (disabled) | "Start Analysis" → run (highlighted) |
| false | true | "Start Research" (enabled) | "Review Report" → view report |
| true | true | "Research Completed" (disabled) | "Review Report" → view report |

**Design Rationale**:
- **Consistent UX**: Buttons clearly indicate completion state
- **Smart behavior**: MVTA button performs most common action (view results when done, run when not)
- **No re-run in MVP**: Avoids database constraint issues; feature deferred to future version
- **No redundancy**: Removed separate "View Damage Report" button at bottom (MVTA card button is sufficient)

---

### Navigation Flow

**Entry Points**:
1. From F-02 Intake Form (after submission)
2. From F-05 Damage Report Display (via "Back to Idea Choice" button)
3. From F-08 Research Engine (after completion)

**Exit Points**:
1. To F-04 MVTA Analysis (when user clicks "Start Analysis" and analysis not completed)
2. To F-08 Research Engine (when user clicks "Start Research" and research not completed)
3. To F-05 Damage Report Display (when user clicks "Review Report" after MVTA completion)
4. To Dashboard (via "Back to Dashboard" button)

**Return Behavior**:
- F-08 (Research Engine) returns to this page after completion
- F-04 (MVTA Analysis) navigates directly to F-05 (Damage Report); user can return via "Back to Idea Choice" button
- Status badges update to reflect completed actions when returning to page

---

### Technical Details

#### API Endpoints

**GET /api/sessions/[sessionId]/status**
- Fetches session status and completion flags
- Returns:
  ```json
  {
    "session": {
      "id": "uuid",
      "status": "choice",
      "research_completed": false,
      "analysis_completed": false,
      "created_at": "timestamp"
    }
  }
  ```

**GET /api/sessions/[sessionId]/idea**
- Fetches structured idea data
- Returns:
  ```json
  {
    "idea": {
      "high_concept": "...",
      "value_proposition": "...",
      "success_metric_18m": "...",
      "environment": { ... },
      "assumptions": { ... },
      "existing_assets": { ... }
    }
  }
  ```

#### State Management

```typescript
interface ChoicePageState {
  session: {
    id: string;
    status: string;
    research_completed: boolean;
    analysis_completed: boolean;
  };
  idea: StructuredIdea;
  isExpanded: boolean; // For collapsible idea summary
  isLoading: boolean;
  error: string | null;
}
```

#### Component Files

```
/app/analyze/[sessionId]/choice/
├── page.tsx                    # Main page component
└── components/
    ├── IdeaSummary.tsx         # Collapsible idea display
    └── ActionButtons.tsx       # Two-card action selector
```

---

### Error Handling

**Missing Session**:
- If session not found → Redirect to home with error toast
- If idea not found → Redirect to intake form

**Network Failures**:
- Show retry button
- Preserve user's expanded/collapsed state

**Direct URL Access**:
- If session status is 'intake' → Redirect to intake form
- If session status is 'completed' → Show page normally (allow re-runs)

---

### Acceptance Criteria

- [✓] User lands on choice page after completing intake form
- [✓] Idea summary displays Step 1 fields by default
- [✓] "Show Full Details" expands to show all intake fields
- [✓] Two action cards display with correct icons and descriptions
- [✓] Status badges accurately reflect completion state
- [✓] **MVTA button smart labeling and navigation**:
  - When not completed → Shows "Start Analysis", navigates to F-04
  - When completed → Shows "Review Report", navigates to F-05
- [✓] **No re-run buttons** (feature deferred to future version)
- [✓] Clicking Research button navigates to F-08 (only when not completed)
- [✓] Research button shows "Start Research" when not completed, "Research Completed" (disabled) when done
- [✓] After completing Research, user returns to choice page automatically
- [✓] After completing MVTA, user navigates to Damage Report (F-05), can return via "Back to Idea Choice" button
- [✓] Status badges update after returning from completed actions
- [✓] Page handles missing data gracefully (redirects to appropriate page)
- [✓] No redundant "View Damage Report" button at page bottom

---

### Design Notes

**Visual Hierarchy**:
1. Idea summary is prominent but not overwhelming (collapsed by default)
2. Action cards are the primary focus (equal visual weight)
3. MVTA card is slightly emphasized (primary action)

**Responsive Design**:
- Desktop: Two cards side-by-side
- Tablet: Two cards side-by-side with reduced padding
- Mobile: Cards stack vertically

**Accessibility**:
- Clear heading structure
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators on interactive elements

---

### Future Enhancements (Out of Scope for MVP)

- [ ] **Re-run functionality**: Allow users to re-run MVTA analysis and Research
  - Requires implementing upsert logic for damage_reports (currently has unique constraint on session_id)
  - Add "Re-run Analysis" button for MVTA when completed
  - Add "Re-run Research" button for Research when completed
- [ ] Add progress indicator showing "2 of 2 analyses complete"
- [ ] Add tooltips explaining what each analysis does
- [ ] Add "Recommended path" suggestion based on idea characteristics
- [ ] Add animation when status badges update
- [ ] Add ability to edit idea from choice page
- [ ] Add "Share" button to export idea summary
