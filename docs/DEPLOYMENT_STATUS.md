# Deployment Status (Checkpoint 1)

Date: 2026-05-19
Workspace: `MySawitAll` (multi-repo)

## 1) Current State Audit

### A. Auth (`be-management-autentikasi`)
- Stack: Spring Boot 3.5.x, Spring Security, Spring Data JPA, Gradle Kotlin DSL.
- Default port: `8080` (`server.port=${SERVER_PORT:8080}`).
- DB: currently hardcoded/default H2 in-memory in `src/main/resources/application.properties`.
- Security:
  - JWT filter + `DaoAuthenticationProvider` + `CustomUserDetailsService` + `BCryptPasswordEncoder` exist.
  - Route matcher currently permits `/api/auth/**` (includes signin/signup), `/api/test/all`, `/h2-console/**`.
- Login endpoint: `POST /api/auth/signin`.
- Me endpoint used by frontend: `GET /api/users/me` (requires Bearer token).
- Seeder: `AdminSeeder` creates `admin@mysawit.com` / `admin123` if absent.

### B. Kebun (`be-managemen-kebun`)
- Stack: Spring Boot, PostgreSQL/PostGIS-oriented repository.
- Default port: `8081`.
- DB config env-driven in app props:
  - `DB_URL` default `jdbc:postgresql://localhost:5432/kebun_db`
  - `DB_USERNAME`, `DB_PASSWORD`.
- Existing compose maps host `55432 -> container 5432` for local DB.
- Public endpoint for smoke: `GET /kebun`.

### C. Hasil Panen (`be-management-hasil-panen`)
- Stack: Spring Boot, Flyway, REST clients to Auth + Kebun.
- Default port: `8082` (app runtime).
- DB defaults to H2 unless env vars override to PostgreSQL.
- Health endpoint: `GET /health`.
- Functional endpoints include `/harvests`, `/harvests/me`, `/mandor/harvests`.
- Existing service compose has app port mapping `${APP_PORT}:8080` (mismatch risk vs app default 8082 unless env overrides SERVER_PORT).

### D. Frontend (`front-end`)
- Stack: Next.js App Router.
- Env resolution already implemented in `src/config/env.ts`:
  - `NEXT_PUBLIC_AUTH_API_BASE_URL` (fallback localhost:8080)
  - `NEXT_PUBLIC_KEBUN_API_BASE_URL` (fallback localhost:8081)
  - `NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL` (fallback localhost:8082)
- Login flow:
  - calls `POST /api/auth/signin`
  - stores JWT in `localStorage` (`mysawit_token`)
  - calls `GET /api/users/me`
  - role-based redirect exists.
- Visible error messages already rendered on login page.

## 2) Known Breakpoints / Risks

1. Auth still defaults to H2, not PostgreSQL -> violates deployment goal.
2. Hasil Panen also defaults to H2 unless env provided -> needs standardized env contract for demo.
3. Existing debug prints in Auth login include password/hash output -> security/log hygiene issue.
4. Potential 401 root cause likely in auth configuration/runtime mismatch state, must be reproduced with actual logs + HTTP calls after PG migration.
5. Multi-repo root is not a single git repository; checkpoint commits must be done per sub-repo.
6. Docker host-vs-container DB naming must be explicit in new root local/prod compose to avoid localhost/service-name confusion.

## 3) Checkpoint 2 Exact Next Steps

### A. Prepare PostgreSQL for Auth (local)
1. Start local Postgres for auth (new root compose in next checkpoint or temporary standalone run).
2. Add `org.postgresql:postgresql` runtime dependency in auth build file.
3. Convert auth datasource props to env-based PostgreSQL defaults.
4. Move H2 into optional profile (`application-h2.properties`) only.
5. Externalize JWT secret/expiration with env-backed properties.

### B. Secure auth behavior and logging
6. Confirm `AuthenticationProvider` uses `CustomUserDetailsService` + BCrypt (keep).
7. Ensure explicit permitAll includes `/api/auth/signin` and `/api/auth/signup`.
8. Remove noisy credential debug logs from signin path.
9. Add clear startup logs for admin seeding success/already-exists.

### C. Reproduce + fix 401 with evidence
10. Run auth against PostgreSQL.
11. Test signin:
   - `POST /api/auth/signin` with `admin@mysawit.com/admin123` -> expect token.
12. Test authenticated endpoint:
   - `GET /api/users/me` with Bearer token -> expect 200 and user identity.
13. If failure:
   - inspect auth logs + stack trace
   - inspect JWT generation/validation flow
   - apply root-cause fix
   - rerun both calls until pass.

### D. Commit checkpoint changes
14. Commit only auth repo changes with checkpoint commit message.
15. Record smoke output summary before moving to checkpoint 3.
