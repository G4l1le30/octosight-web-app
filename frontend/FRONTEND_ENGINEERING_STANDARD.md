# FRONTEND_ENGINEERING_STANDARD.md — OctoSight

Dokumen ini adalah standar teknis detail frontend. Baca setelah `FRONTEND_BEST_PRACTICES.md`.

---

## 1. App Router Conventions

### Route Groups

Gunakan route groups `(group)` untuk memisahkan konteks layout tanpa memengaruhi URL:

```
app/
  (auth)/          → halaman publik: /login
  (user)/          → halaman nasabah (protected): /dashboard, /report, /tickets, /education, /validate
  (admin)/         → halaman admin (protected + role): /admin/dashboard, /admin/tickets, /admin/users
```

### Server vs Client Components

| Gunakan `"use client"` | Gunakan Server Component |
|---|---|
| Form interaktif, event handler | Halaman statik, layout |
| State lokal (`useState`, `useReducer`) | Fetch data awal (tidak perlu real-time) |
| Chart.js, animasi, countdown | Rendering tabel statis |
| Custom hook yang pakai browser API | Metadata, `<head>` tags |

Aturan: default adalah Server Component. Tambahkan `"use client"` hanya jika benar-benar perlu.

### Loading & Error States

Setiap route segment wajib memiliki `loading.tsx` dan `error.tsx`:

```typescript
// app/(user)/tickets/loading.tsx
export default function Loading() {
  return <div className="flex justify-center p-8"><Spinner /></div>;
}

// app/(user)/tickets/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 text-center">
      <p className="text-red-500">{error.message}</p>
      <button onClick={reset} className="mt-4 btn-primary">Coba lagi</button>
    </div>
  );
}
```

---

## 2. Component Standards

### Anatomi Komponen

```typescript
// components/tickets/TicketCard.tsx
import { TicketResponse } from "@/modules/tickets/ticket.types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RiskScoreMeter } from "@/components/detection/RiskScoreMeter";

interface TicketCardProps {
  ticket: TicketResponse;
  onClick?: (id: number) => void;
}

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <div
      className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(ticket.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm text-gray-500">{ticket.ticket_code}</span>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="text-sm text-gray-700 truncate">{ticket.url_or_sender}</p>
      <div className="mt-3 flex items-center gap-2">
        <RiskScoreMeter score={ticket.final_risk_score} />
        <span className="text-xs text-gray-400">{ticket.modus_type}</span>
      </div>
    </div>
  );
}
```

### Props Interface

- Selalu definisikan interface `Props` yang eksplisit — jangan gunakan `any`.
- Gunakan `?` untuk prop opsional, berikan default value di destructuring jika ada.
- Event handler: nama `on<Event>` (misal: `onClick`, `onSubmit`, `onStatusChange`).

---

## 3. Form Standards

Setiap form wajib mengikuti pola ini:

```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ticketCreateSchema, TicketCreateInput } from "@/modules/tickets/ticket.schema";
import { ticketApi } from "@/modules/tickets/ticket.api";

export default function ReportForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketCreateInput>({
    resolver: zodResolver(ticketCreateSchema),
  });

  const onSubmit = async (data: TicketCreateInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const ticket = await ticketApi.create(data);
      setSuccess(`Laporan berhasil dikirim. Ticket ID: ${ticket.ticket_code}`);
      reset();
    } catch (err: any) {
      setApiError(err.response?.data?.message ?? "Gagal mengirim laporan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && <Alert type="success">{success}</Alert>}
      {apiError && <Alert type="error">{apiError}</Alert>}

      <div>
        <label className="label">URL / Nomor Pengirim *</label>
        <input {...register("url_or_sender")} className="input" />
        {errors.url_or_sender && <p className="error-msg">{errors.url_or_sender.message}</p>}
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? <Spinner size="sm" /> : "Kirim Laporan"}
      </button>
    </form>
  );
}
```

---

## 4. Risk Score Visual Standards

Konsistensi warna dan label risk score di seluruh aplikasi:

```typescript
// constants/ticket.ts
export const RISK_SCORE_CONFIG = {
  HIGH:   { min: 70, color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    label: "Tinggi" },
  MEDIUM: { min: 40, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", label: "Sedang" },
  LOW:    { min: 0,  color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200",  label: "Rendah" },
} as const;

export function getRiskConfig(score: number) {
  if (score >= 70) return RISK_SCORE_CONFIG.HIGH;
  if (score >= 40) return RISK_SCORE_CONFIG.MEDIUM;
  return RISK_SCORE_CONFIG.LOW;
}
```

```typescript
// components/detection/RiskScoreMeter.tsx
import { getRiskConfig } from "@/constants/ticket";

export function RiskScoreMeter({ score }: { score: number }) {
  const config = getRiskConfig(score);
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}>
      <span>{score}</span>
      <span>/100</span>
    </div>
  );
}
```

---

## 5. Dashboard Chart Standards

### Konfigurasi Chart.js

```typescript
// components/charts/ModusBarChart.tsx
"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ModusBarChartProps {
  data: { modus: string; count: number }[];
}

export default function ModusBarChart({ data }: ModusBarChartProps) {
  const chartData = {
    labels: data.map((d) => d.modus),
    datasets: [{
      label: "Jumlah Laporan",
      data: data.map((d) => d.count),
      backgroundColor: ["#EF4444", "#F59E0B", "#3B82F6", "#8B5CF6"],
    }],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  return <Bar data={chartData} options={options} />;
}
```

### Aturan Chart

- Setiap chart wrappernya `"use client"` karena Chart.js butuh DOM.
- Sediakan skeleton/placeholder saat data belum tersedia.
- Gunakan warna yang konsisten: merah = HIGH/phishing, kuning = MEDIUM, hijau = LOW/safe, biru = info netral.
- Semua chart harus `responsive: true`.

---

## 6. Notification & Education Standards

### Notifikasi In-App

```typescript
// components/ui/RiskNotificationBanner.tsx
interface RiskNotificationBannerProps {
  ticketCode: string;
  modusType: string;
  onDismiss: () => void;
}

export function RiskNotificationBanner({ ticketCode, modusType, onDismiss }: RiskNotificationBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <span className="text-red-500 text-xl">⚠️</span>
      <div className="flex-1">
        <p className="font-semibold text-red-700">Laporan Anda ({ticketCode}) terdeteksi berisiko tinggi</p>
        <p className="text-sm text-red-600 mt-1">
          Modus: {modusType}. Pelajari cara melindungi diri dari penipuan {modusType}.
        </p>
        <a href="/education" className="text-sm font-medium text-red-700 underline mt-1 inline-block">
          Lihat Materi Edukasi →
        </a>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600">✕</button>
    </div>
  );
}
```

**Aturan:** banner ini hanya ditampilkan ketika `ticket.priority === "HIGH"`. Jangan tampilkan untuk MEDIUM atau LOW.

### Education Module

```typescript
// components/education/MaterialCard.tsx
import { EducationMaterial } from "@/modules/education/education.types";

export function MaterialCard({ material, onStart }: { material: EducationMaterial; onStart: () => void }) {
  return (
    <div className="rounded-xl border p-5 hover:shadow-md transition-all">
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
        {material.topic_tag}
      </span>
      <h3 className="font-semibold mt-3 mb-1">{material.title}</h3>
      <p className="text-sm text-gray-500">~{material.read_time_minutes} menit baca</p>
      <button onClick={onStart} className="mt-4 btn-primary w-full">
        Mulai Belajar
      </button>
    </div>
  );
}
```

---

## 7. TypeScript Standards

### Tipe Ticket

```typescript
// modules/tickets/ticket.types.ts
export type TicketStatus =
  | "Submitted"
  | "In Review"
  | "Confirmed"
  | "False Positive"
  | "Need More Info"
  | "Mitigated"
  | "Closed";

export type TicketPriority = "HIGH" | "MEDIUM" | "LOW";
export type ModusType = "SMS" | "WhatsApp" | "Email" | "Web";

export interface TicketResponse {
  id: number;
  ticket_code: string;
  url_or_sender: string;
  modus_type: ModusType;
  incident_summary: string;
  evidence_url?: string;
  rule_score: number;
  ml_score: number;
  final_risk_score: number;
  priority: TicketPriority;
  label: string;
  explanation: string[];
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}
```

### Hindari `any`

```typescript
// ❌ Jangan
const handleError = (err: any) => console.log(err.message);

// ✅ Lakukan
import { AxiosError } from "axios";
const handleError = (err: unknown) => {
  if (err instanceof AxiosError) {
    console.log(err.response?.data?.message);
  }
};
```

---

## 8. Tailwind CSS Standards

### Class Grouping (urutan yang konsisten)

```tsx
// Layout → Spacing → Typography → Color → Border → Shadow → Interaction
<div className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
```

### Custom Class Shorthand (di `globals.css`)

```css
/* globals.css */
@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
  }
  .btn-secondary {
    @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors;
  }
  .input {
    @apply w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent;
  }
  .label {
    @apply block text-sm font-medium text-gray-700 mb-1;
  }
  .error-msg {
    @apply text-xs text-red-500 mt-1;
  }
}
```

---

## 9. Checklist Sebelum PR Frontend

- [ ] `npm run lint` bersih — tidak ada TypeScript error atau ESLint warning
- [ ] `npm run build` berhasil tanpa error
- [ ] Semua form menggunakan `react-hook-form` + Zod
- [ ] Tidak ada `any` type yang tidak perlu
- [ ] Loading dan error state ditangani di setiap halaman yang fetch data
- [ ] Komponen chart sudah `"use client"`
- [ ] Middleware proteksi route berfungsi untuk `/admin/...`
- [ ] Risk notification banner hanya muncul untuk `priority === "HIGH"`
- [ ] Evidence file upload tervalidasi (tipe + ukuran) sebelum dikirim
- [ ] Tidak ada `console.log` debugging yang tertinggal
- [ ] Responsive di mobile (min-width 375px) dan desktop