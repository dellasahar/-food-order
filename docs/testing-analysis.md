# FoodOrder — Analisis Testing UTS

## 1. Kebutuhan dan aturan bisnis

| ID | Kebutuhan | Aturan uji |
|---|---|---|
| FR-01 | User dapat login | Email dan password wajib terisi; kredensial demo valid |
| FR-02 | User melihat katalog | Katalog menampilkan nama, harga, stok, kategori |
| FR-03 | User mengelola keranjang | Quantity integer 1–10 dan tidak melebihi stok |
| FR-04 | User checkout | Nama, alamat, telepon, login, dan cart wajib valid |
| FR-05 | Sistem membuat order | Harga dan total dihitung dari data server |
| FR-06 | Status order berubah | Hanya transisi yang didefinisikan yang diperbolehkan |

## 2. State Transition Testing

### State model

```text
DRAFT ────────> CONFIRMED ────────> COMPLETED
  │                 │
  └───────────────> CANCELLED <────┘
```

| Current | Next | Expected |
|---|---|---|
| DRAFT | CONFIRMED | Valid |
| DRAFT | CANCELLED | Valid |
| CONFIRMED | COMPLETED | Valid |
| CONFIRMED | CANCELLED | Valid |
| COMPLETED | CANCELLED | Invalid |
| CANCELLED | DRAFT | Invalid |

Implementasi: `lib/business.ts:updateOrderStatus` dan BDD: `tests/features/order-status.feature`.

## 3. White-box / Cyclomatic Complexity

### Fungsi `validateQuantity`

Predicate keputusan:
1. type dan integer valid
2. quantity minimal 1
3. quantity maksimum 10
4. quantity tidak melebihi stock

Dengan pendekatan `V(G) = predicate + 1`, kompleksitas siklomatik dasar adalah **5**.

Independent paths yang diuji:
- Q1: input bukan integer
- Q2: quantity < 1
- Q3: quantity > 10
- Q4: quantity > stock
- Q5: quantity valid

### Fungsi `updateOrderStatus`

Predicate utama adalah apakah `next` terdapat pada daftar transisi yang diizinkan. Jalur independen mencakup valid DRAFT→CONFIRMED, DRAFT→CANCELLED, CONFIRMED→COMPLETED, CONFIRMED→CANCELLED, dan invalid terminal-state transition. Test otomatis tersedia di `tests/unit/business.test.ts`.

## 4. TDD evidence checklist

Untuk laporan, ambil screenshot tiga tahap berikut dari minimal dua fungsi:

1. **Red** — tambahkan assertion untuk perilaku yang belum diimplementasikan dan jalankan `pnpm test:unit`.
2. **Green** — implementasikan fungsi dan ulangi test sampai semua passing.
3. **Refactor** — rapikan implementasi tanpa mengubah behavior, lalu ulangi test.

Fungsi yang direkomendasikan: `validateQuantity` dan `updateOrderStatus`.

## 5. Defect report template

| ID | Scenario | Steps | Expected | Actual | Severity | Status |
|---|---|---|---|---|---|---|
| DEF-001 | Invalid quantity | Masukkan quantity 0 | Ditolak dengan pesan validasi | Isi hasil eksekusi | High | Open/Closed |
| DEF-002 | Invalid transition | COMPLETED→CANCELLED | HTTP 409 dan error JSON | Isi hasil eksekusi | High | Open/Closed |

## 6. Bukti eksekusi

- Unit/API: output `pnpm test`
- BDD: output `pnpm test:bdd`
- UI: screenshot Cypress atau browser preview
- Build: output `pnpm build`
- Database: screenshot Prisma schema/seed dan konfigurasi MySQL
