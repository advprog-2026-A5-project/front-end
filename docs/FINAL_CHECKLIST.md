# Final Demo Checklist

## A. Service Readiness
- [ ] Auth running with PostgreSQL (not H2 default)
- [ ] Kebun running with PostgreSQL
- [ ] Hasil Panen running with PostgreSQL
- [ ] Frontend running and reachable on port `3000`

## B. Integration Readiness
- [ ] `POST /api/auth/signin` returns JWT for `admin@mysawit.com`
- [ ] `GET /api/users/me` returns authenticated identity with Bearer token
- [ ] `GET /kebun` reachable
- [ ] `GET /health` (Hasil Panen) reachable
- [ ] `scripts/smoke-test-local.ps1` passes
- [ ] `scripts/smoke-test-local.sh` passes

## C. Deployment Readiness (EC2)
- [ ] `deployment/docker-compose.prod.yml` exists
- [ ] `deployment/.env` created from `.env.example`
- [ ] `docker compose ... up -d --build` successful
- [ ] Containers restart policy is `unless-stopped`
- [ ] Persistent DB volumes attached

## D. Evidence Capture (Screenshots)
- [ ] Screenshot: Docker containers up
- [ ] Screenshot: Auth signin response with token
- [ ] Screenshot: Frontend login success + redirected page
- [ ] Screenshot: Smoke test success output
- [ ] Screenshot: EC2 compose logs (no fatal startup errors)

## E. Security & Config Hygiene
- [ ] No production secrets hardcoded in committed source
- [ ] JWT secret set via env in deployment
- [ ] Frontend API URLs configured via env
