# AT2 Implementation Status

Updated: 2026-03-01

## Implemented in Code

### Objective 1-2 (Block-Based + Transition to Text)
- Block editor and code generation implemented.
- Real-time code execution endpoints available.

### Objective 3 (Teacher Features)
- Assignment creation, deadlines, and student assignment targeting.
- Teacher analytics dashboard with CSV export.
- Submission review with mark + feedback workflow.
- Student roster filtering, search, and at-risk highlighting.
- Teacher challenge lifecycle management: create, edit, and delete with ownership checks.
- Teacher roster adaptive snapshot with intervention hints.

### Objective 4 (Engagement/Gamification)
- Points and badges implemented.
- Leaderboard implemented on student dashboard (`FR21`).
- Experience-to-level progression implemented (`FR22`).

### Adaptive Learning (FR27-FR29)
- Student challenge recommendations now adapt to performance and assignment pressure.
- Dynamic target difficulty (`easy/medium/hard`) is computed from recent outcomes.
- Learning path guidance is surfaced in student dashboard adaptive profile.

### Objective 5 (Accessibility)
- Accessibility panel (contrast, text size, keyboard shortcuts).
- WCAG-focused styles and keyboard navigation support.

### Objective 6 (Data Protection)
- GDPR routes for access/export/delete/consent.
- Security middleware for sanitization, headers, rate limiting, and centralized error handling.

## Requirement Coverage Notes

- `FR21` Leaderboard: implemented via student dashboard API + UI.
- `FR22` Experience -> level progression: implemented in submission marking and progress updates.
- `FR27` challenge recommendations based on performance: implemented via `/dashboard/student` adaptive scoring + UI recommendations.
- `FR28` adaptive difficulty: implemented via dynamic target difficulty in student profile.
- `FR29` adaptive learning path adjustment: implemented via adaptive profile and recommendation reasons.
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
