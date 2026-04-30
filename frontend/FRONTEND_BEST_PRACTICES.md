# FRONTEND_BEST_PRACTICES.md — OctoSight Frontend

Stack: **Next.js 15 (App Router) + TypeScript + Tailwind CSS + Zod + Axios + Chart.js**

---

## 1. Struktur Direktori

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (user)/
│   │   ├── dashboard/page.tsx
│   │   ├── report/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── tickets/[id]/page.tsx
│   │   ├── validate/page.tsx
│   │   ├── education/page.tsx
│   │   └── layout.tsx
│   ├── (admin)/
│   │   ├── dashboard/page.tsx
│   │   ├── tickets/page.tsx
│   │   ├── tickets/[id]/page.tsx
│   │   ├── users/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx             # Root layout
│   └── globals.css
├── components/
│   ├── ui/                    # Primitive: Button, Badge, Input, Modal, etc.
│   ├── tickets/               # TicketCard, TicketStatusBadge, TicketTable
│   ├── detection/             # RiskScoreMeter, ExplanationList
│   ├── charts/                # TrendLineChart, ModusBarChart, RiskDonutChart
│   ├── education/             # MaterialCard, QuizWidget
│   └── layout/                # Navbar, Sidebar, PageHeader
├── modules/
│   ├── tickets/
│   │   ├── ticket.api.ts      # Axios fetcher functions
│   │   ├── ticket.schema.ts   # Zod schemas
│   │   ├── ticket.types.ts    # TypeScript interfaces
│   │   └── useTickets.ts      # Custom hooks
│   ├── detection/
│   ├── auth/
│   ├── education/
│   └── dashboard/
├── lib/
│   ├── axios.ts               # Axios instance + interceptors
│   └── auth.ts                # Token helpers
├── constants/
│   ├── ticket.ts              # STATUS_OPTIONS, PRIORITY_OPTIONS, MODUS_TYPES
│   └── routes.ts              # Route path constants
└── types/
    └── api.ts                 # Generic APIResponse<T>, PaginatedResponse<T>
```

---

## 2. Konvensi Naming

| Item | Konvensi | Contoh |
|---|---|---|
| Halaman (page) | `page.tsx` di folder route | `app/(user)/report/page.tsx` |
| Komponen | `PascalCase.tsx` | `TicketCard.tsx` |
| Hook | `use<Name>.ts` | `useTickets.ts` |
| Fetcher | `<resource>.api.ts` | `ticket.api.ts` |
| Schema Zod | `<resource>.schema.ts` | `ticket.schema.ts` |
| Tipe | `<resource>.types.ts` | `ticket.types.ts` |
| Konstanta | `UPPER_SNAKE_CASE` | `TICKET_STATUS`, `MODUS_TYPES` |

---

## 3. Fetching Data

Gunakan Axios instance terpusat dari `lib/axios.ts`. Jangan gunakan `fetch()` native kecuali untuk Next.js Server Components yang memerlukan caching.

```typescript
// lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // untuk httpOnly cookie
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // redirect ke login
    }
    return Promise.reject(error);
  }
);

export default api;
```

Fungsi fetcher di `modules/<feature>/<feature>.api.ts`:

```typescript
// modules/tickets/ticket.api.ts
import api from "@/lib/axios";
import { TicketCreate, TicketResponse, PaginatedTickets } from "./ticket.types";

export const ticketApi = {
  async getAll(page = 1, limit = 10): Promise<PaginatedTickets> {
    const { data } = await api.get("/api/tickets", { params: { page, limit } });
    return data;
  },

  async getById(id: number): Promise<TicketResponse> {
    const { data } = await api.get(`/api/tickets/${id}`);
    return data.data;
  },

  async create(payload: TicketCreate, evidence?: File): Promise<TicketResponse> {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => form.append(k, String(v)));
    if (evidence) form.append("evidence_file", evidence);
    const { data } = await api.post("/api/tickets", form);
    return data.data;
  },
};
```

---

## 4. Validasi Form dengan Zod

Definisikan schema di `modules/<feature>/<feature>.schema.ts`. Gunakan `react-hook-form` + `zodResolver`:

```typescript
// modules/tickets/ticket.schema.ts
import { z } from "zod";

export const ticketCreateSchema = z.object({
  url_or_sender: z.string().min(1, "URL atau nomor pengirim wajib diisi"),
  modus_type: z.enum(["SMS", "WhatsApp", "Email", "Web"], {
    errorMap: () => ({ message: "Pilih tipe modus yang valid" }),
  }),
  incident_summary: z.string().min(10, "Ringkasan minimal 10 karakter"),
  report_date: z.string().min(1, "Tanggal kejadian wajib diisi"),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
```

```typescript
// Di komponen form
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ticketCreateSchema, TicketCreateInput } from "@/modules/tickets/ticket.schema";

const { register, handleSubmit, formState: { errors } } = useForm<TicketCreateInput>({
  resolver: zodResolver(ticketCreateSchema),
});
```

---

## 5. Custom Hooks

Buat hook di `modules/<feature>/use<Feature>.ts` untuk logika yang reusable:

```typescript
// modules/tickets/useTickets.ts
import { useState, useEffect } from "react";
import { ticketApi } from "./ticket.api";
import { TicketResponse } from "./ticket.types";

export function useTickets(page: number = 1) {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ticketApi.getAll(page)
      .then((res) => setTickets(res.data))
      .catch(() => setError("Gagal memuat data ticket"))
      .finally(() => setLoading(false));
  }, [page]);

  return { tickets, loading, error };
}
```

---

## 6. Tipe Global API

Definisikan tipe generik di `types/api.ts` agar konsisten:

```typescript
// types/api.ts
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  metadata: {
    total_items: number;
    current_page: number;
    last_page: number;
    items_per_page: number;
  };
}
```

---

## 7. Komponen Chart.js (Dashboard)

Bungkus Chart.js dalam komponen React di `components/charts/`. Setiap chart menerima data via props dan tidak melakukan fetching sendiri.

```typescript
// components/charts/TrendLineChart.tsx
"use client";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface TrendLineChartProps {
  labels: string[];
  values: number[];
}

export default function TrendLineChart({ labels, values }: TrendLineChartProps) {
  const data = {
    labels,
    datasets: [{
      label: "Jumlah Insiden",
      data: values,
      borderColor: "#EF4444",
      backgroundColor: "rgba(239, 68, 68, 0.1)",
    }],
  };
  return <Line data={data} />;
}
```

---

## 8. Auth & Route Protection

- Token JWT disimpan di httpOnly cookie (diset oleh backend, bukan JavaScript).
- Gunakan middleware Next.js (`middleware.ts`) untuk proteksi route berdasarkan role.
- Redirect ke `/login` jika tidak ada token; redirect ke `/` jika role tidak sesuai.

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token");
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  // decode role dari token untuk admin check
  return NextResponse.next();
}

export const config = {
  matcher: ["/(user)/:path*", "/(admin)/:path*"],
};
```

---

## 9. Komponen UI Primitif

Buat komponen dasar di `components/ui/` agar konsisten di seluruh aplikasi:

| Komponen | Deskripsi |
|---|---|
| `Button` | Variant: primary, secondary, danger, outline |
| `Badge` | Warna berdasarkan `priority`: HIGH=merah, MEDIUM=kuning, LOW=hijau |
| `StatusBadge` | Warna berdasarkan `status` ticket |
| `Input`, `Textarea`, `Select` | Form field dengan error state |
| `Modal` | Dialog konfirmasi dan detail |
| `Spinner` | Loading indicator |
| `Alert` | Info, warning, error, success |

---

## 10. Aturan Wajib Frontend

| # | Aturan |
|---|---|
| 1 | Semua form wajib menggunakan `react-hook-form` + Zod schema. Tidak boleh validasi manual. |
| 2 | Komponen chart tidak boleh fetch data sendiri — terima data dari props atau parent. |
| 3 | Jangan gunakan `localStorage` untuk menyimpan token. Gunakan httpOnly cookie dari backend. |
| 4 | Halaman admin (`/admin/...`) wajib diproteksi oleh middleware + server-side role check. |
| 5 | Setiap state loading dan error wajib ditangani dengan UI yang informatif (Spinner, Alert). |
| 6 | Gunakan Tailwind utility class — tidak boleh menambahkan custom CSS kecuali di `globals.css` untuk variabel global. |
| 7 | Evidence file upload hanya boleh JPEG/PNG, validasi ukuran ≤ 5 MB di sisi frontend sebelum dikirim. |
| 8 | Risk score badge warna: ≥ 70 = merah (`HIGH`), 40–69 = kuning (`MEDIUM`), < 40 = hijau (`LOW`). |