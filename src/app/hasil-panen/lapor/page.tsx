"use client";

import { hasilPanenApi } from "@/api/hasilPanenApi";
import { useAuth } from "@/auth/AuthContext";
import { AppShell } from "@/components/AppShell";
import { AuthGuard } from "@/components/AuthGuard";
import { HarvestErrorState } from "@/components/hasil-panen/HarvestStates";
import { mapHarvestErrorMessage } from "@/components/hasil-panen/harvestHelpers";
import { env } from "@/config/env";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function HarvestReportCreatePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [kilogram, setKilogram] = useState("");
  const [reportText, setReportText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const maxUploadSizeBytes = env.maxUploadSizeMb * 1024 * 1024;
  const hasLargeFiles = useMemo(
    () => photos.some((photo) => photo.size > maxUploadSizeBytes),
    [maxUploadSizeBytes, photos],
  );
  const hasUnsupportedFiles = useMemo(
    () => photos.some((photo) => !photo.type.startsWith("image/")),
    [photos],
  );

  const validate = () => {
    const kg = Number(kilogram);
    if (!Number.isFinite(kg) || kg <= 0) {
      return "Kilogram panen harus diisi dan lebih dari 0.";
    }
    if (!reportText.trim()) {
      return "Berita hasil panen wajib diisi.";
    }
    if (photos.length === 0) {
      return "Minimal satu foto bukti panen wajib diunggah.";
    }
    if (hasUnsupportedFiles) {
      return "File yang diunggah harus bertipe gambar.";
    }
    if (hasLargeFiles) {
      return `Ukuran file melebihi batas ${env.maxUploadSizeMb} MB.`;
    }
    return null;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await hasilPanenApi.createMultipart(token, {
        kilogram: Number(kilogram),
        reportText: reportText.trim(),
        photos,
      });
      setSuccess("Laporan panen berhasil dikirim.");
      router.push(`/hasil-panen/${result.harvestId}`);
    } catch (submitError) {
      setError(
        mapHarvestErrorMessage(
          submitError,
          "Gagal mengirim laporan panen. Silakan coba lagi.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <AuthGuard roles={["BURUH"]}>
      <AppShell>
        <div className="mx-auto max-w-4xl space-y-5">
          <section className="rounded-3xl border border-emerald-500/25 bg-slate-900/85 p-6">
            <h2 className="text-2xl font-semibold text-slate-100">Lapor Hasil Panen</h2>
            <p className="mt-2 text-sm text-slate-400">
              Kirim laporan panen harian beserta bukti foto. Setiap buruh hanya dapat mengirim satu laporan per hari.
            </p>
          </section>

          {error && <HarvestErrorState text={error} />}
          {success && (
            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <form className="space-y-4 rounded-3xl border border-slate-700 bg-slate-900/80 p-6" onSubmit={onSubmit}>
            <label className="block text-sm text-slate-200">
              Kilogram sawit yang dipanen
              <input
                className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                data-testid="harvest-kilogram-input"
                inputMode="decimal"
                min="0"
                placeholder="Contoh: 120.5"
                step="0.01"
                type="number"
                value={kilogram}
                onChange={(event) => setKilogram(event.target.value)}
              />
            </label>

            <label className="block text-sm text-slate-200">
              Berita hasil panen
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                data-testid="harvest-report-textarea"
                placeholder="Tuliskan ringkasan hasil panen hari ini..."
                value={reportText}
                onChange={(event) => setReportText(event.target.value)}
              />
            </label>

            <label className="block text-sm text-slate-200">
              Bukti foto hasil panen
              <input
                accept="image/*"
                className="mt-1 block w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
                data-testid="harvest-photo-input"
                multiple
                type="file"
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  setPhotos(selected);
                }}
              />
            </label>

            {photos.length > 0 && (
              <section className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
                <p className="text-sm font-medium text-slate-200">Preview file terpilih ({photos.length})</p>
                <ul className="mt-3 space-y-2">
                  {photos.map((photo, index) => (
                    <li
                      className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300"
                      key={`${photo.name}-${photo.lastModified}`}
                    >
                      <span className="truncate pr-3">
                        {photo.name} ({Math.round(photo.size / 1024)} KB)
                      </span>
                      <button
                        className="rounded-md border border-slate-500 px-2 py-1 text-xs hover:bg-slate-800"
                        data-testid={`remove-photo-${index}`}
                        type="button"
                        onClick={() => removePhoto(index)}
                      >
                        Hapus
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Link
                className="rounded-xl border border-slate-500 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                href="/hasil-panen/riwayat"
              >
                Buka Riwayat
              </Link>
              <button
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                data-testid="submit-harvest-report-button"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Laporan"}
              </button>
            </div>
          </form>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
