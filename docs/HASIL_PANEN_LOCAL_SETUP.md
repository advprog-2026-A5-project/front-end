# Hasil Panen Frontend Local Integration Setup

## 1) Jalankan service backend lokal
- Auth: `http://localhost:8080`
- Manajemen Kebun: `http://localhost:8081`
- Manajemen Hasil Panen: `http://localhost:8082`

Pastikan endpoint berikut dapat diakses:
- Auth: `/api/auth/signin`, `/api/users/me`
- Kebun: `/kebun`
- Hasil Panen: `/health`

## 2) Frontend env
Copy `.env.example` ke `.env.local` dan sesuaikan bila perlu.

Gunakan naming env Next.js:
- `NEXT_PUBLIC_AUTH_API_BASE_URL`
- `NEXT_PUBLIC_KEBUN_API_BASE_URL`
- `NEXT_PUBLIC_HASIL_PANEN_API_BASE_URL`
- `KEBUN_API_BASE_URL`
- `HASIL_PANEN_API_BASE_URL`
- `NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB`

## 3) Jalankan frontend
```bash
npm install
npm run dev
```

## 4) Selenium E2E setup
Isi kredensial user seed di `.env.local`:
- `E2E_BASE_URL`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_BURUH_EMAIL`
- `E2E_BURUH_PASSWORD`
- `E2E_MANDOR_EMAIL`
- `E2E_MANDOR_PASSWORD`
- `E2E_HEADLESS`
- `E2E_SKIP_MUTATION_IF_NO_SEED`

Contoh key tersedia pada `.env.e2e.example`.

Jalankan:
```bash
npm run test:e2e
```

Mode browser terlihat:
```bash
npm run test:e2e:headed
```
