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

**Scenario 2: Research First** (UPDATED - Multi-Type Research)
- User: Clicks "Online Research" button
- System: Navigates to `/analyze/[sessionId]/research-choice` (F-08 Type Selection)
- User: Selects research type (e.g., Competitor Research)
- System: Navigates to `/analyze/[sessionId]/research?type=competitor`
- [F-08 executes competitor research only]
- System: Returns to Choice Page
- User: Sees Research badge updated (e.g., "1 type completed")
- User: Can click "Online Research" again to select and run other types
- User: Clicks "Start MVTA Analysis"
- [F-04 executes MVTA - NOTE: MVTA does NOT use research data per requirements]
- System: Navigates directly to Damage Report page (F-05)
- User: Views damage report, can click "Back to Idea Choice" to return

**Scenario 3: After Completion** (UPDATED)
- User: Has completed one or more Research types and/or MVTA
- Research button: Shows "Online Research" with badge "(X types completed)"
  - Clicking navigates to research-choice page where user can:
    - View completed research types (click to see results)
    - Run additional research types (click to execute)
- MVTA button: Shows "Review Report" and navigates to report when MVTA completed

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

**Research Button Behavior** (UPDATED for Multi-Type):
- **Button Label**: Always "Online Research"
- **Badge** (optional):
  - When 0 types completed → No badge or "Not Started"
  - When 1-2 types completed → "X types completed"
  - When 3 types completed → "All completed ✓"
- **Click Action**: Always navigate to `/analyze/[sessionId]/research-choice` (F-08 Type Selection)
  - User can view completed types or run new types from there

**Button States Table** (UPDATED):

| research_types_completed | analysis_completed | Research Button | MVTA Button |
|-------------------------|-------------------|----------------|-------------|
| 0 | false | "Online Research" (enabled) | "Start Analysis" → run |
| 1-2 | false | "Online Research" + "X types completed" badge | "Start Analysis" → run |
| 3 | false | "Online Research" + "All completed ✓" | "Start Analysis" → run |
| 0-3 | true | "Online Research" + badge (always enabled) | "Review Report" → view report |

**Note**: Research button is **always enabled** - it navigates to research-choice page where users can view or run research types.

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
3. From F-08 Research Engine (after completing a research type)
4. From F-08 Research Type Selection (via "Back to Choice Page" button)

**Exit Points** (UPDATED):
1. To F-04 MVTA Analysis (when user clicks "Start Analysis" and analysis not completed)
2. To **F-08 Research Type Selection** (when user clicks "Online Research" - always enabled)
3. To F-05 Damage Report Display (when user clicks "Review Report" after MVTA completion)
4. To Dashboard (via "Back to Dashboard" button)

**Return Behavior**:
- F-08 (Research Engine) returns to this page after completing a research type
- F-08 (Research Type Selection) can return via "Back to Choice Page" button
- F-04 (MVTA Analysis) navigates directly to F-05 (Damage Report); user can return via "Back to Idea Choice" button
- Research badge updates to reflect number of completed research types when returning to page

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

- [ ] User lands on choice page after completing intake form
- [ ] Idea summary displays Step 1 fields by default
- [ ] "Show Full Details" expands to show all intake fields
- [ ] Two action cards display with correct icons and descriptions
- [ ] **MVTA button smart labeling and navigation**:
  - When not completed → Shows "Start Analysis", navigates to F-04
  - When completed → Shows "Review Report", navigates to F-05
- [ ] **Research button (UPDATED for multi-type)**:
  - Always shows "Online Research" label
  - Shows badge with completion count (e.g., "1 type completed", "All completed ✓")
  - Always enabled - navigates to F-08 Research Type Selection
- [ ] After completing a research type, user returns to choice page automatically
- [ ] Research badge updates to reflect number of completed types
- [ ] After completing MVTA, user navigates to Damage Report (F-05), can return via "Back to Idea Choice" button
- [ ] Page handles missing data gracefully (redirects to appropriate page)
- [ ] No redundant "View Damage Report" button at page bottom

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
