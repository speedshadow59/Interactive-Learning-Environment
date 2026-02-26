# AT2 Implementation Status

Updated: 2026-02-26

## Implemented in Code

### Objective 1-2 (Block-Based + Transition to Text)
- Block editor and code generation implemented.
- Real-time code execution endpoints available.

### Objective 3 (Teacher Features)
- Assignment creation, deadlines, and student assignment targeting.
- Teacher analytics dashboard with CSV export.
- Submission review with mark + feedback workflow.
- Student roster filtering, search, and at-risk highlighting.

### Objective 4 (Engagement/Gamification)
- Points and badges implemented.
- Leaderboard implemented on student dashboard (`FR21`).
- Experience-to-level progression implemented (`FR22`).

### Objective 5 (Accessibility)
- Accessibility panel (contrast, text size, keyboard shortcuts).
- WCAG-focused styles and keyboard navigation support.

### Objective 6 (Data Protection)
- GDPR routes for access/export/delete/consent.
- Security middleware for sanitization, headers, rate limiting, and centralized error handling.

## Requirement Coverage Notes

- `FR21` Leaderboard: implemented via student dashboard API + UI.
- `FR22` Experience -> level progression: implemented in submission marking and progress updates.
- `FR30` identify struggling students: implemented via teacher roster at-risk signals and filters.

## Remaining AT2 Evidence (Non-Code Artifacts)

These are not purely code changes and still require your assessment evidence pack:
- User testing round outputs and findings.
- Accessibility audit reports (axe/WAVE + manual checks).
- Performance/load testing report.
- Security testing/audit report.

## Quick Evidence Pointers

- Student dashboard: `frontend/src/pages/StudentDashboard.js`
- Teacher dashboard: `frontend/src/pages/TeacherDashboard.js`
- Dashboard API: `backend/src/routes/dashboardRoutes.js`
- Submission marking + progression: `backend/src/routes/submissionRoutes.js`
- Progress updates: `backend/src/routes/progressRoutes.js`
- Privacy/GDPR: `backend/src/routes/privacyRoutes.js`
