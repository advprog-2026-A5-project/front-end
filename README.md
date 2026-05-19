# MySawit Front-end (Next.js)

Frontend integration app for:
- `be-management-autentikasi` (Auth)
- `be-managemen-kebun` (Kebun)
- `be-management-hasil-panen` (Hasil Panen)

## Tech stack
- Next.js 15 + TypeScript
- App Router
- Tailwind CSS

## Folder structure
- `src/app` route pages
- `src/api` service clients per backend
- `src/auth` auth context and session control
- `src/components` reusable layout and guards
- `src/config` environment reader
- `src/types` shared DTO typings

## Run locally
1. Start backend services first:
   - Auth: `http://localhost:8080`
   - Kebun: `http://localhost:8081`
   - Hasil Panen: `http://localhost:8082`
2. Copy env:
   - `cp .env.example .env.local` (PowerShell: `Copy-Item .env.example .env.local`)
3. Install and run:
   - `npm ci`
   - `npm run dev`
4. Open `http://localhost:3000`

## Routes
- `/login`
- `/dashboard`
- `/admin`
- `/admin/users`
- `/admin/assignments`
- `/admin/kebun`
- `/buruh/harvests`
- `/mandor/harvests`
- `/integration-smoke-test`

## Local test script
1. Login as `ADMIN`.
2. Open `/admin/users` and verify Buruh + Mandor accounts exist.
3. Open `/admin/assignments` and assign Buruh -> Mandor.
4. Open `/admin/kebun` and create kebun then set `mandorId`.
5. Logout and login as BURUH.
6. Open `/buruh/harvests`, submit harvest.
7. Logout and login as MANDOR.
8. Open `/mandor/harvests`, approve/reject pending harvest.
9. Click `Check` eligibility for transport status.

## CI/CD
- CI workflow: `.github/workflows/frontend-ci.yml`
  - runs lint + build
- Sonar workflow: `.github/workflows/frontend-sonar.yml`
  - needs `SONAR_TOKEN` secret

## Recommended commit messages
- `feat(frontend): add auth context and role-based route guards`
- `feat(frontend): add admin users and assignment pages`
- `feat(frontend): add kebun management page integrated with kebun service`
- `feat(frontend): add buruh and mandor harvest workflow pages`
- `feat(frontend): add integration smoke test dashboard`
- `chore(ci): add frontend ci and sonar workflows`

## Manual setup you must do
1. GitHub secret `SONAR_TOKEN` in repo settings.
2. Create SonarCloud project and set key/organization in `sonar-project.properties` (if you want full sonar metadata).
3. Ensure backend CORS allows `http://localhost:3000`.
4. If deploying frontend, add deployment workflow and platform secrets (Vercel token or server SSH key), depending on your target.

## Known limitations
- Some backend endpoints may differ by branch; this frontend follows current implemented endpoints.
- Kebun assign/unassign controller is represented via kebun create/update with `mandorId` field.
- Browser-based CORS validation must be verified while all three backends are running locally.

## Remaining backend blockers
- If any service blocks `Origin: http://localhost:3000`, frontend calls will fail until local-dev CORS is allowed.
- If Auth `/api/users/me` is unavailable or protected by incompatible token policy, login bootstrap will fail.
