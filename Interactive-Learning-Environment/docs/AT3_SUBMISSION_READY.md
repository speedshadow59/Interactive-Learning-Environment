# AT3 Submission Readiness (COM668)

Last updated: 03/03/2026

## 1) Current Project Status

- Core app features implemented and seeded with demonstration data.
- Docker services run correctly (`frontend`, `backend`, `mongodb`).
- Frontend production build compiles successfully via Docker image build.
- Known backend test-suite issues remain in mock/spec assertions (see section 4).

## 2) Pre-Submission Commands

Run from repository root.

```powershell
# Ensure latest containers and code are running
docker compose up -d --build

# (Optional) refresh demo database data
docker compose exec backend npm run seed
```

## 3) Build & Runtime Verification (AT3)

```powershell
# Check service health
docker compose ps

# Build distributable images
docker compose build frontend backend
```

Expected state:
- all 3 services are `Up`
- frontend and backend images build without compilation errors

## 4) Known Non-Blocking Issues

Current backend test suite has 2 assertion-level failures in `tests/test.spec.js`:

1. Precision assertion expects `76.67` but receives `76.66666666666667`.
2. Placeholder bcrypt example hash does not match strict regex pattern.

These are test-data/assertion issues and do not block runtime functionality demonstrated in AT3 video.

## 5) Generate Source Code Zip (AT3 Format)

Use the helper script to generate a clean source code zip excluding large/generated folders (e.g., `node_modules`, `.git`, `build`).

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create_at3_submission_zip.ps1 -Surname "YourSurname" -FirstName "YourFirstName" -BCode "B00123456"
```

Output:
- `../AT3-Submissions/AT3_Surname_Firstname_B-code.zip` (outside repo by default)
- Suggested video filename printed by script: `AT3_Surname_Firstname_B-code.mp4`

Optional custom output path:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create_at3_submission_zip.ps1 -Surname "YourSurname" -FirstName "YourFirstName" -BCode "B00123456" -OutputDir "D:\AT3-Submissions"
```

## 6) Final Blackboard Submission Checks

- Use **Panopto Student Submission** for video (not drag-drop file upload).
- Submit source code zip to the separate source code link.
- Confirm both uploads open/play correctly after submission.
- Keep screenshots of successful uploads with timestamps.

## 7) Demo Credentials (Seed Data)

- Admin: `admin_master / password123`
- Teacher: `mr_smith / password123`
- Student: `alex_coder / password123`
