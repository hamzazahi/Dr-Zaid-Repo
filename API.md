# DentSuite API Reference (for Postman / any HTTP client)

The backend is Supabase, so there are three API surfaces, all on one base URL:

| Surface | Base path | What it does |
|---|---|---|
| **Auth** | `/auth/v1` | Sign in, get JWT tokens |
| **REST (PostgREST)** | `/rest/v1` | Auto-generated CRUD for every table + RPC functions |
| **Storage** | `/storage/v1` | File upload/download (buckets: `documents`, `imaging`) |

**Base URL:** `https://bipkrvxwfrqurawltqem.supabase.co`

> **Quick start:** import `DentSuite.postman_collection.json` (repo root) into Postman,
> set the `anon_key` collection variable (copy `VITE_SUPABASE_ANON_KEY` from your `.env`),
> run **Auth → Sign in (doctor)** once — every other request then works automatically.

---

## 1 · Authentication

Every request needs **two headers**:

```
apikey: <anon key>
Authorization: Bearer <access_token>
```

- `apikey` is always the anon key (from `.env` → `VITE_SUPABASE_ANON_KEY`).
- `Authorization` is the **user's JWT** from sign-in. If you send the anon key here
  instead, RLS treats you as anonymous → every table returns `[]`. This is the
  #1 "why is my response empty" cause.

### Sign in

```
POST {{base_url}}/auth/v1/token?grant_type=password
Content-Type: application/json
apikey: <anon key>

{ "email": "admin@drzaiddental.com", "password": "Test@123" }
```

Response contains `access_token` (JWT, ~1 h lifetime), `refresh_token`, and `user`.
Use `access_token` as the Bearer token. Dev accounts (⚠ rotate before real data):

| Email | Role |
|---|---|
| `admin@drzaiddental.com` | doctor (full access) |
| `reception@drzaiddental.com` | receptionist (restricted — great for testing RLS) |

### Refresh / sign out

```
POST /auth/v1/token?grant_type=refresh_token   { "refresh_token": "..." }
POST /auth/v1/logout                            (Bearer token required)
```

---

## 2 · REST — the universal pattern

Every table is at `GET|POST|PATCH|DELETE /rest/v1/<table>`. The same grammar works on all of them:

### Read (GET)

| Want | URL |
|---|---|
| All rows | `/rest/v1/patients?select=*` |
| One by id | `/rest/v1/patients?id=eq.<uuid>` |
| Filter | `/rest/v1/invoices?status=eq.Unpaid` |
| Search (case-insens.) | `/rest/v1/patients?name=ilike.*ali*` |
| Compare | `/rest/v1/payments?amount=gte.1000` — also `lte`, `gt`, `lt`, `neq`, `in.(a,b)` |
| Sort | `&order=date.desc` |
| Paginate | `&limit=10&offset=20` |
| Pick columns | `?select=id,name,phone` |
| **Join** (FK embed) | `/rest/v1/appointments?select=*,patients(name),staff(name)` |
| Nested join | `/rest/v1/treatment_plans?select=*,plan_items(*),patients(name)` |
| Count | header `Prefer: count=exact` → count arrives in `Content-Range` response header |

### Create (POST)

```
POST /rest/v1/patients
Content-Type: application/json
Prefer: return=representation        ← without this you get 201 + empty body

{ "name": "Postman Test", "phone": "0300-0000000", "gender": "Male" }
```

Send an **array** to bulk-insert. Server fills `id`, `created_at`, and column defaults.

### Update (PATCH) — filter is REQUIRED

```
PATCH /rest/v1/appointments?id=eq.<uuid>
Prefer: return=representation

{ "status": "Completed" }
```

### Delete (DELETE) — filter is REQUIRED

```
DELETE /rest/v1/recalls?id=eq.<uuid>
Prefer: return=representation        ← shows what was deleted
```

### Upsert (used by tooth/perio charting)

```
POST /rest/v1/tooth_records?on_conflict=patient_id,tooth_number
Prefer: resolution=merge-duplicates,return=representation

{ "patient_id": "<uuid>", "tooth_number": 36, "status": "filled", "surfaces": "O" }
```

---

## 3 · All tables + who can do what

RLS is enforced **in the database** — the receptionist token physically cannot bypass it.
`R` = read, `W` = insert/update/delete.

| Table | Doctor | Receptionist | Notes / key columns |
|---|---|---|---|
| `patients` | RW | RW | name*, gender, dob, phone, email, allergies, status, blood_group |
| `appointments` | RW | RW | patient_id*, dentist_id, date*, time, type, status (Scheduled→…→Completed) |
| `recalls` | RW | RW | patient_id*, type*, due_date, status, channel (WhatsApp/SMS/Email) |
| `booking_requests` | RW | RW | patient_name*, phone, preferred_date, status (Pending/Confirmed/Declined) |
| `conversations` | RW | RW | patient_id* (unique), channel; embed `messages(*)` |
| `messages` | RW | RW | conversation_id*, sender* (clinic/patient), body* |
| `payments` | RW | RW | invoice_id*, patient_id*, amount* (>0), method — **fires the billing trigger** |
| `memberships` | RW | RW | patient_id*, plan_id*, start_date, renewal_date, status |
| `documents` | RW | RW | patient_id*, name*, category, file_type, size, storage_path |
| `form_submissions` | RW | RW | patient_id*, template_id*, template_name*, status, signed_by |
| `lab_cases` | RW | RW | patient_id*, lab_name*, case_type, status (Sent→…→Fitted), cost |
| `referrals` | RW | RW | direction* (Inbound/Outbound), patient_name*, provider, status |
| `inventory` | RW | RW | name*, category, current_stock, reorder_level, unit_price |
| `claims` | RW | RW | patient_id*, payer*, claimed_amount, approved_amount, status |
| `invoices` | RW | R + insert | invoice_number* (unique), total_amount*; **paid_amount/status/balance_due are trigger-managed — never PATCH them** |
| `treatments` | RW | R | patient_id*, type*, cost*, tooth_number, dentist_id |
| `treatment_plans` | RW | R | patient_id*, title*, status; embed `plan_items(*)` |
| `plan_items` | RW | R | plan_id*, procedure*, cost, done |
| `prescriptions` | RW | R | patient_id*, medication*, dosage, frequency, duration, status |
| `tooth_records` | RW | R | patient_id* + tooth_number* (1–32, unique pair), status*, surfaces |
| `tooth_history` | RW | R | append log of tooth status changes |
| `perio_entries` | RW | R | patient_id* + tooth_number* (unique pair), depths (int array), bop (bool) |
| `imaging_records` | RW | R | patient_id*, type*, tooth_number, taken_by, storage_path |
| `campaigns` | RW | R | name*, channel, segment*, status (Draft/Sent), recipients |
| `staff` | RW | R | name*, role*, specialty, status, location_id |
| `locations` | RW | R | name*, address, chairs, status, is_primary |
| `membership_plans` | RW | R | name*, price, cycle (Monthly/Annual), discount |
| `expenses` | RW | **nothing** — always `[]` | date, category*, vendor, amount*, status (Paid/Pending) |
| `audit_log` | R + insert | insert only (select returns `[]`) | append-only: UPDATE/DELETE refused for everyone |
| `profiles` | R | R | read-only from the client; managed via dashboard/SQL |

`*` = required on insert. All ids are uuids; dates are `YYYY-MM-DD`; money is numeric.

---

## 4 · The billing state machine (best trigger demo)

1. `GET /rest/v1/invoices?invoice_number=eq.INV-2026-003` → note `id`, `status`, `paid_amount`.
2. `POST /rest/v1/payments` with `{ "invoice_id": "<that id>", "patient_id": "<its patient_id>", "amount": 500, "method": "Cash" }`.
3. Re-run step 1 → `paid_amount` increased and `status` recalculated (Unpaid → Partially Paid → Paid) **by the database**, not by any client code.
4. Try `amount: 999999` → **400** `"Payment ... exceeds remaining balance ..."` — overpayment is impossible.
5. `DELETE` that payment → invoice reverts automatically.

---

## 5 · Reporting RPC

```
POST /rest/v1/rpc/period_summary
Content-Type: application/json

{ "granularity": "month", "start_date": "2026-01-01", "end_date": "2026-12-31" }
```

`granularity` ∈ `day | week | month | quarter` (anything else → 400 with a clear message).
Returns one row per period: `period, appointments, revenue, billed, outstanding, invoice_count, paid_invoices, partial_invoices, unpaid_invoices`.

---

## 6 · Storage (files)

Buckets: `documents` (both roles full access) · `imaging` (both read, **doctor-only** upload/delete).
Path convention the app uses: `<patient_id>/<timestamp>-<filename>`.

| Action | Request |
|---|---|
| Upload | `POST /storage/v1/object/<bucket>/<path>` — body = **binary** (Postman: Body → binary → choose file). Header `Content-Type: image/png` (or the real type). |
| Signed URL (1 h) | `POST /storage/v1/object/sign/<bucket>/<path>` body `{ "expiresIn": 3600 }` → returns `signedURL`; download at `{{base_url}}/storage/v1<signedURL>` |
| List | `POST /storage/v1/object/list/<bucket>` body `{ "prefix": "<patient_id>", "limit": 100 }` |
| Delete | `DELETE /storage/v1/object/<bucket>/<path>` |

Both auth headers are required. Receptionist upload to `imaging` → 403 RLS violation (by design).

---

## 7 · Error cheat-sheet

| Symptom | Meaning |
|---|---|
| `401 Invalid API key` | `apikey` header missing/wrong |
| `200` but `[]` everywhere | Bearer token is the anon key or expired → sign in again |
| `403` code `42501` "row-level security" | Your role isn't allowed (e.g. receptionist inserting a prescription) — working as designed |
| `400` code `P0001` | A trigger refused it (e.g. overpayment guard) — message says why |
| `400` code `23514` | CHECK constraint (bad status value, negative amount, tooth not 1–32) |
| `409` code `23505` | Unique violation (duplicate invoice_number, second conversation for same patient) |
| `409` code `23503` | FK violation (patient_id doesn't exist) |
| `404 Bucket not found` | Storage migration `0005_storage.sql` not run |

---

## 8 · Useful seed ids

| Thing | Value |
|---|---|
| Patient — Muhammad Ali | `30000000-0000-0000-0000-000000000001` |
| Seed invoices | `INV-2026-001` (Partially Paid), `INV-2026-002` (Paid), `INV-2026-003` (Partially Paid — 1000/5000 from earlier testing) |

Realtime (live table sync) is WebSocket-based and not testable in Postman — verify it by opening the app in two browser tabs instead.
