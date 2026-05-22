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

## Routes
- `/login`
- `/dashboard`
- `/admin`
- `/admin/users`
- `/admin/assignments`
- `/admin/kebun`
- `/hasil-panen`
- `/hasil-panen/lapor`
- `/hasil-panen/riwayat`
- `/hasil-panen/mandor`
- `/hasil-panen/mandor/buruh/:buruhId`
- `/hasil-panen/:id`

Legacy compatibility routes:
- `/buruh/harvests` -> redirect ke `/hasil-panen/riwayat`
- `/mandor/harvests` -> redirect ke `/hasil-panen/mandor`

## Local env
Gunakan naming env Next.js yang sudah dipakai proyek:
- `NEXT_PUBLIC_AUTH_API_BASE_URL`
- `NEXT_PUBLIC_KEBUN_API_BASE_URL`
- `NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL`
- `KEBUN_API_BASE_URL`
- `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB` (opsional, default 5MB)

## E2E Selenium (lokal)
E2E membaca seed users dari `.env.local`:
- `E2E_BASE_URL`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_BURUH_EMAIL`
- `E2E_BURUH_PASSWORD`
- `E2E_MANDOR_EMAIL`
- `E2E_MANDOR_PASSWORD`
- `E2E_HEADLESS`
- `E2E_SKIP_MUTATION_IF_NO_SEED`

Jalankan:
- `npm run test:e2e`
- `npm run test:e2e:headed`
