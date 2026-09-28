# AGENTS.md — Infrastructure Asset Lifecycle Inventory Hackathon

## 1. Mission

Build a **working end-to-end infrastructure asset inventory system** for the problem statement:

> **Building an end-to-end infrastructure asset inventory to track and manage assets across their entire lifecycle.**

The hackathon goal is to deliver a polished, demo-ready web application quickly.

The system must let an organization:

- Register infrastructure assets.
- Track each asset from procurement to retirement.
- See current status, location, custodian, cost, health, and lifecycle stage.
- Record maintenance events and lifecycle history.
- Search and filter the complete inventory.
- Show high-level operational metrics on a dashboard.
- Flag assets requiring maintenance, warranty attention, or replacement.
- Maintain an auditable timeline of every important change.

The product should feel like a lightweight **Infrastructure Asset Management / CMMS dashboard**, not a generic CRUD app.

---

# 2. Non-Negotiable Tech Stack

Use:

- **Frontend:** React + Vite
- **Language:** JavaScript
- **UI:** Tailwind CSS
- **Routing:** React Router
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Node.js + Express
- **Database:** SQLite
- **SQLite library:** `better-sqlite3`
- **API:** REST
- **Date handling:** `date-fns`
- **Package manager:** npm

Do **not** introduce:

- PostgreSQL
- MongoDB
- Firebase
- Supabase
- Docker unless absolutely necessary
- Kubernetes
- GraphQL
- Microservices
- Complex authentication providers
- Redux unless genuinely needed

This is a hackathon. Optimize for **speed, reliability, clarity, and demo quality**.

---

# 3. Project Structure

Create:

```text
asset-inventory/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── db/
│   │   ├── database.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── routes/
│   ├── controllers/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
├── README.md
└── AGENTS.md
```

Prefer simple modules over deep abstractions.

---

# 4. Core Product Concept

Every asset has a lifecycle:

```text
Planned
  ↓
Procured
  ↓
Received
  ↓
Installed
  ↓
Operational
  ↓
Under Maintenance
  ↓
Operational
  ↓
End of Life
  ↓
Retired / Disposed
```

Every meaningful asset action must create a **history/event record**.

Example:

```text
Asset created
↓
Procurement completed
↓
Installed at Plant A
↓
Assigned to Operations Team
↓
Preventive maintenance completed
↓
Condition changed from Good → Fair
↓
Replacement recommended
↓
Asset retired
```

This timeline is one of the most important hackathon features.

---

# 5. Main User Stories

The app must support these flows.

## Inventory Manager

Can:

- Add an asset.
- Edit asset information.
- Search assets.
- Filter assets.
- View asset details.
- Change lifecycle stage.
- Assign an asset.
- Change its location.
- View maintenance history.
- Schedule maintenance.
- Mark maintenance complete.
- Retire an asset.

## Management / Operations

Can:

- See number of assets.
- See total asset value.
- See lifecycle distribution.
- See assets requiring maintenance.
- See assets reaching warranty expiry.
- See assets nearing end-of-life.
- See condition distribution.
- See recent activity.

---

# 6. Asset Categories

Seed realistic infrastructure categories:

- HVAC
- Electrical
- Generator
- Transformer
- Pump
- Compressor
- Server
- Network Equipment
- CCTV
- Fire Safety
- Elevator
- Water System
- Building Equipment
- Vehicle
- Solar Equipment
- Other

---

# 7. Asset Lifecycle Stages

Use these exact lifecycle values:

```text
PLANNED
PROCURED
RECEIVED
INSTALLED
OPERATIONAL
MAINTENANCE
END_OF_LIFE
RETIRED
```

Use badges/colors in the UI.

---

# 8. Asset Condition Values

```text
EXCELLENT
GOOD
FAIR
POOR
CRITICAL
```

---

# 9. Asset Criticality

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Criticality should help prioritize maintenance.

---

# 10. Database Schema

Use SQLite.

Create the following tables.

## assets

```sql
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,

    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,

    purchase_date TEXT,
    purchase_cost REAL DEFAULT 0,
    supplier TEXT,

    warranty_expiry TEXT,
    expected_life_years INTEGER,

    location TEXT,
    department TEXT,
    custodian TEXT,

    lifecycle_stage TEXT NOT NULL DEFAULT 'PLANNED',
    condition TEXT NOT NULL DEFAULT 'GOOD',
    criticality TEXT NOT NULL DEFAULT 'MEDIUM',

    installation_date TEXT,
    commissioning_date TEXT,
    retirement_date TEXT,

    notes TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## maintenance_records

```sql
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,

    maintenance_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    scheduled_date TEXT,
    completed_date TEXT,

    technician TEXT,
    vendor TEXT,

    cost REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'SCHEDULED',

    findings TEXT,
    action_taken TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(asset_id) REFERENCES assets(id)
);
```

Maintenance types:

```text
PREVENTIVE
CORRECTIVE
INSPECTION
CALIBRATION
EMERGENCY
```

Maintenance statuses:

```text
SCHEDULED
IN_PROGRESS
COMPLETED
CANCELLED
```

## asset_events

```sql
CREATE TABLE IF NOT EXISTS asset_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,

    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,

    old_value TEXT,
    new_value TEXT,

    performed_by TEXT DEFAULT 'System',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(asset_id) REFERENCES assets(id)
);
```

Typical event types:

```text
CREATED
UPDATED
STATUS_CHANGED
LOCATION_CHANGED
ASSIGNED
MAINTENANCE_SCHEDULED
MAINTENANCE_COMPLETED
CONDITION_CHANGED
RETIRED
```

## locations

```sql
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'India'
);
```

---

# 11. Seed Data

Generate at least **20 realistic demo assets**.

Use Indian context where useful.

Examples:

```text
AST-0001 — 500 KVA Transformer — Electrical
AST-0002 — Diesel Generator DG-01 — Generator
AST-0003 — Chiller Unit CH-02 — HVAC
AST-0004 — Water Pump WP-04 — Pump
AST-0005 — Cisco Core Switch — Network Equipment
AST-0006 — Dell PowerEdge Server — Server
AST-0007 — Fire Pump FP-01 — Fire Safety
AST-0008 — Passenger Elevator EL-02 — Elevator
AST-0009 — CCTV NVR Unit — CCTV
AST-0010 — Rooftop Solar Inverter — Solar Equipment
```

Locations:

```text
Main Plant
Utility Block
Server Room
Admin Building
Warehouse
Production Floor A
Production Floor B
Electrical Room
Pump House
Security Control Room
```

Seed records across different lifecycle stages and conditions so dashboard charts look useful.

Seed at least:

- 5 maintenance records.
- 15 asset history events.
- 3 upcoming maintenance jobs.
- 2 overdue jobs.
- 2 assets with warranties expiring soon.
- 2 assets near end-of-life.

---

# 12. Backend API

Base URL:

```text
/api
```

## Health

```http
GET /api/health
```

Return:

```json
{
  "status": "ok"
}
```

---

## Assets

### List assets

```http
GET /api/assets
```

Support query params:

```text
search
category
stage
condition
criticality
location
```

Example:

```text
/api/assets?search=generator&stage=OPERATIONAL
```

### Get single asset

```http
GET /api/assets/:id
```

Return asset plus:

- maintenance records
- event history

### Create asset

```http
POST /api/assets
```

Automatically:

- Generate asset code if missing.
- Create a `CREATED` event.

Format:

```text
AST-0001
AST-0002
...
```

### Update asset

```http
PUT /api/assets/:id
```

When these fields change:

- lifecycle_stage
- condition
- location
- custodian

Automatically create appropriate event records.

### Delete asset

```http
DELETE /api/assets/:id
```

Prefer soft lifecycle retirement for real use, but deletion is acceptable for hackathon/admin convenience.

---

# 13. Lifecycle Endpoint

```http
PATCH /api/assets/:id/lifecycle
```

Body:

```json
{
  "stage": "OPERATIONAL"
}
```

Automatically add an event:

```text
Lifecycle changed from INSTALLED to OPERATIONAL
```

---

# 14. Maintenance API

```http
GET /api/maintenance
GET /api/assets/:id/maintenance
POST /api/assets/:id/maintenance
PUT /api/maintenance/:id
PATCH /api/maintenance/:id/complete
DELETE /api/maintenance/:id
```

When maintenance is created:

- create `MAINTENANCE_SCHEDULED` event.

When completed:

- create `MAINTENANCE_COMPLETED` event.

---

# 15. Dashboard API

Create:

```http
GET /api/dashboard
```

Return one response containing:

```json
{
  "summary": {
    "totalAssets": 0,
    "totalAssetValue": 0,
    "operationalAssets": 0,
    "maintenanceAssets": 0,
    "criticalAssets": 0,
    "maintenanceDue": 0
  },
  "stageDistribution": [],
  "categoryDistribution": [],
  "conditionDistribution": [],
  "recentEvents": [],
  "maintenanceDue": [],
  "warrantyExpiring": [],
  "endOfLifeAssets": []
}
```

Avoid many separate dashboard API calls.

---

# 16. Business Logic

## Maintenance Due

A maintenance task is due when:

```text
status != COMPLETED
AND scheduled_date <= today + 30 days
```

Overdue:

```text
status != COMPLETED
AND scheduled_date < today
```

---

# 17. Warranty Alert

Show an alert when:

```text
warranty_expiry <= today + 90 days
AND warranty_expiry >= today
```

---

# 18. End-of-Life Calculation

If:

```text
purchase_date + expected_life_years
```

is within the next year, flag:

```text
Approaching End of Life
```

If already passed:

```text
End of Life
```

No machine learning is needed for this hackathon feature.

If time remains, create a simple **health/risk score**.

---

# 19. Optional Asset Risk Score

Only implement after the core system works.

Compute a 0–100 risk score based on:

```text
condition
criticality
overdue maintenance
age
warranty status
```

Example:

```text
Risk Score =
Condition Risk × 0.35
+ Criticality Risk × 0.25
+ Maintenance Risk × 0.25
+ Age Risk × 0.15
```

Suggested values:

Condition:

```text
EXCELLENT = 5
GOOD = 20
FAIR = 45
POOR = 70
CRITICAL = 100
```

Criticality:

```text
LOW = 10
MEDIUM = 35
HIGH = 70
CRITICAL = 100
```

Display only as:

```text
Low
Medium
High
Critical
```

Do not claim this is AI.

---

# 20. Frontend Pages

Required routes:

```text
/
 /assets
 /assets/new
 /assets/:id
 /assets/:id/edit
 /maintenance
```

Optional:

```text
/locations
/reports
```

---

# 21. Application Layout

Use a professional dashboard layout.

## Sidebar

Items:

```text
Dashboard
Assets
Maintenance
Locations
Reports
```

Bottom:

```text
Infrastructure Asset Manager
Hackathon Prototype
```

## Top Bar

Show:

- Current page
- Search shortcut
- Add Asset button

---

# 22. Dashboard

This is the main demo screen.

At the top show cards:

```text
Total Assets
Asset Value
Operational
Maintenance Due
Critical Assets
```

Then charts:

### Lifecycle Distribution

Bar or donut chart.

### Asset Condition

Donut chart.

### Assets by Category

Bar chart.

Then panels:

### Maintenance Attention

Show:

- overdue
- due soon

### Warranty Expiring

Show next 90 days.

### Recent Asset Activity

Timeline/table.

The dashboard must look useful even before the judge clicks anything.

---

# 23. Asset Inventory Page

Create a table with columns:

```text
Asset Code
Asset
Category
Location
Lifecycle
Condition
Criticality
Custodian
Actions
```

Features:

- Search.
- Category filter.
- Lifecycle filter.
- Condition filter.
- Criticality filter.
- Location filter.
- Clear filters.
- Add Asset button.

Search should match:

- code
- name
- serial number
- manufacturer
- model
- location
- custodian

---

# 24. Asset Detail Page

This is the most important detailed screen.

Header:

```text
AST-0004
Water Pump WP-04
OPERATIONAL
GOOD
HIGH CRITICALITY
```

Show sections:

## Overview

- Asset code
- Category
- Manufacturer
- Model
- Serial number
- Description

## Ownership / Placement

- Location
- Department
- Custodian

## Financial

- Purchase date
- Cost
- Supplier
- Warranty expiry

## Lifecycle

- Current stage
- Installation date
- Commissioning date
- Expected useful life
- Estimated EOL

## Maintenance

- Upcoming jobs
- Completed maintenance
- Total maintenance cost

## Asset Timeline

Display all `asset_events` chronologically.

Example:

```text
Sep 28 — Preventive maintenance scheduled
Sep 12 — Condition changed: EXCELLENT → GOOD
Aug 30 — Assigned to Plant Operations
Aug 21 — Lifecycle changed: INSTALLED → OPERATIONAL
Aug 18 — Asset installed at Utility Block
Aug 05 — Asset created
```

Use vertical timeline UI.

---

# 25. Add/Edit Asset Form

Group into sections.

## Basic

```text
Name *
Category *
Description
Manufacturer
Model
Serial Number
```

## Procurement

```text
Purchase Date
Purchase Cost
Supplier
Warranty Expiry
Expected Life
```

## Placement

```text
Location
Department
Custodian
```

## Operational

```text
Lifecycle Stage
Condition
Criticality
Installation Date
Commissioning Date
```

Buttons:

```text
Cancel
Save Asset
```

Use validation.

---

# 26. Maintenance Page

Tabs/filters:

```text
All
Overdue
Upcoming
Completed
```

Table:

```text
Asset
Maintenance
Type
Scheduled Date
Status
Technician
Cost
Actions
```

Support quick action:

```text
Mark Complete
```

---

# 27. Create Maintenance Modal

Fields:

```text
Asset
Maintenance Type
Title
Description
Scheduled Date
Technician
Vendor
Estimated Cost
```

---

# 28. UI Design Requirements

Visual style:

- Clean enterprise dashboard.
- Light background.
- White cards.
- Rounded corners.
- Subtle shadows/borders.
- Blue as primary accent.
- Consistent spacing.
- Dense enough for business software.
- Responsive for laptop and tablet.

Avoid:

- Huge gradients.
- Cartoonish UI.
- Excessive animation.
- Landing-page-style design.
- Empty screens.
- Giant hero banners.

---

# 29. Important UI Components

Build reusable:

```text
Sidebar
TopBar
StatCard
StatusBadge
ConditionBadge
CriticalityBadge
DataTable
EmptyState
ConfirmDialog
AssetForm
MaintenanceForm
Timeline
AlertCard
```

---

# 30. Badge Logic

Lifecycle:

```text
PLANNED
PROCURED
RECEIVED
INSTALLED
OPERATIONAL
MAINTENANCE
END_OF_LIFE
RETIRED
```

Conditions:

```text
EXCELLENT
GOOD
FAIR
POOR
CRITICAL
```

Criticality:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Use readable visual distinctions, but do not spend excessive time perfecting colors.

---

# 31. Demo-Ready Data Formatting

Currency:

```text
₹ 12,50,000
```

Use:

```js
new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
})
```

Dates:

```text
28 Sep 2026
```

---

# 32. Error Handling

Frontend must gracefully handle:

- Loading.
- API errors.
- Empty results.
- Failed form submission.

Backend must return proper JSON errors:

```json
{
  "error": "Asset not found"
}
```

Use:

```text
400 — bad input
404 — not found
500 — internal error
```

---

# 33. Development Rules for Coding Agent

When implementing:

1. Get the backend + SQLite working first.
2. Seed database early.
3. Validate APIs using curl or a lightweight request.
4. Build frontend only after basic APIs work.
5. Connect screens to real SQLite data.
6. Never leave core pages dependent on hardcoded frontend arrays.
7. Do not rewrite working modules unnecessarily.
8. Fix runtime errors immediately.
9. Keep API response structures predictable.
10. Keep all forms functional.
11. Never spend most of the hackathon on authentication.
12. Prioritize demo completeness over perfect abstractions.
13. Do not stop after scaffolding.
14. Continue until the app can be run end-to-end.

---

# 34. Implementation Order

Follow exactly this order.

## Phase 1 — Bootstrap

Create:

```text
client/
server/
```

Initialize both.

Install backend:

```bash
npm install express cors better-sqlite3
npm install -D nodemon
```

Install frontend:

```bash
npm install react-router-dom recharts lucide-react date-fns
```

Configure Tailwind using the current recommended Vite setup.

---

## Phase 2 — Database

Implement:

```text
schema.sql
database.js
seed.js
```

Verify data using a small Node script.

---

## Phase 3 — APIs

Implement in this order:

```text
GET    /api/health
GET    /api/assets
GET    /api/assets/:id
POST   /api/assets
PUT    /api/assets/:id
PATCH  /api/assets/:id/lifecycle

GET    /api/maintenance
POST   /api/assets/:id/maintenance
PATCH  /api/maintenance/:id/complete

GET    /api/dashboard
```

Test each endpoint.

---

## Phase 4 — Shell UI

Implement:

```text
Sidebar
TopBar
React Router
API service
```

---

## Phase 5 — Dashboard

Connect to:

```text
GET /api/dashboard
```

Do not hardcode charts.

---

## Phase 6 — Asset Inventory

Build:

```text
/assets
```

with search and filters.

---

## Phase 7 — Asset Details

Build:

```text
/assets/:id
```

with maintenance + lifecycle timeline.

---

## Phase 8 — Asset Creation / Editing

Make CRUD fully functional.

---

## Phase 9 — Maintenance

Build maintenance list and quick-complete workflow.

---

## Phase 10 — Polish

Only now:

- better spacing
- responsive UI
- toasts
- loading skeletons
- empty states
- confirmation dialogs

---

# 35. Hackathon Demo Script

The final product must support this exact demonstration.

## Demo 1 — Executive Overview

Open dashboard.

Say:

> “This dashboard gives the organization a live view of every infrastructure asset, its operational health, lifecycle stage, maintenance burden and financial value.”

Show:

- Total assets.
- Asset value.
- Assets under maintenance.
- Maintenance due.
- Condition distribution.

---

## Demo 2 — Find an Asset

Open inventory.

Search:

```text
Generator
```

Open a generator asset.

Explain:

> “Every asset has one canonical digital record containing procurement, ownership, technical, operational and lifecycle data.”

---

## Demo 3 — Complete Lifecycle View

On asset detail page show:

- purchase information
- installation
- current location
- custodian
- condition
- maintenance
- event timeline

Explain:

> “The timeline gives us a full auditable record rather than scattered Excel sheets and maintenance logs.”

---

## Demo 4 — Schedule Maintenance

Create preventive maintenance for the asset.

Go to Maintenance page.

Show it in upcoming tasks.

---

## Demo 5 — Mark Maintenance Complete

Complete the task.

Return to asset.

Show the automatically generated history event.

This proves the application is truly connected end-to-end.

---

## Demo 6 — Lifecycle Change

Change asset:

```text
OPERATIONAL → MAINTENANCE
```

Show event.

Then:

```text
MAINTENANCE → OPERATIONAL
```

This visually proves lifecycle management.

---

# 36. Judges' Problem-to-Solution Mapping

The implementation should make this clear.

| Problem | Solution |
|---|---|
| Assets scattered across files | Central SQLite inventory |
| No complete lifecycle record | Lifecycle state + event timeline |
| Maintenance missed | Upcoming and overdue maintenance alerts |
| Ownership unclear | Custodian + department + location |
| Management lacks visibility | Executive dashboard |
| Warranty value lost | Warranty expiry alerts |
| Aging infrastructure unmanaged | End-of-life calculation |
| Changes difficult to audit | Immutable-style event history |
| Search difficult | Global inventory filters/search |

---

# 37. Minimum Viable Demo

If time is extremely limited, the following must work:

- Dashboard
- Asset inventory
- Search/filter
- Add asset
- Asset details
- Change lifecycle stage
- Maintenance scheduling
- Maintenance completion
- Asset event timeline
- SQLite persistence

Everything else is secondary.

---

# 38. Stretch Features

Only implement after MVP is stable.

## QR Code Asset Lookup

Generate a QR code containing:

```text
/assets/:id
```

Useful for physical tagging.

## CSV Export

Export inventory.

## CSV Import

Bulk-import existing infrastructure inventories.

## Asset Risk Score

Rules-based health score.

## Location Dashboard

Group assets by site.

## Attachments

Store filenames/URLs for:

- invoice
- warranty
- inspection report
- manual

## Simple Role View

Optional roles:

```text
ADMIN
MANAGER
TECHNICIAN
VIEWER
```

Do not implement full authentication unless there is enough time.

---

# 39. Optional “AI” Feature

Do not force AI into the core problem.

If the hackathon expects AI, implement a tiny **Asset Assistant** only after MVP.

It can translate natural-language questions into predefined filters.

Examples:

```text
“Show critical assets under maintenance.”
“Which warranties expire in the next 90 days?”
“Show pumps in poor condition.”
“What maintenance is overdue?”
```

Implement safely using deterministic rule matching or an optional LLM endpoint.

The system must still work with **zero external AI API dependency**.

Do not let an AI feature become the core bottleneck.

---

# 40. README Requirements

Create a README containing:

## Setup

```bash
git clone <repo>
cd asset-inventory
```

Server:

```bash
cd server
npm install
npm run seed
npm run dev
```

Client:

```bash
cd client
npm install
npm run dev
```

Mention URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3001
```

---

# 41. Backend Package Scripts

Use:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "seed": "node db/seed.js"
  }
}
```

---

# 42. Frontend API Configuration

Create:

```text
client/src/services/api.js
```

Use one base URL:

```js
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
```

Do not scatter URLs throughout components.

---

# 43. CORS

Backend:

```js
app.use(cors());
app.use(express.json());
```

---

# 44. SQLite Requirements

Enable foreign keys:

```js
db.pragma("foreign_keys = ON");
```

Prefer WAL mode:

```js
db.pragma("journal_mode = WAL");
```

Keep database file under:

```text
server/data/assets.db
```

Ensure directory is automatically created.

---

# 45. SQL Safety

Always use prepared statements.

Never concatenate user input into SQL.

Example:

```js
const stmt = db.prepare("SELECT * FROM assets WHERE id = ?");
const asset = stmt.get(id);
```

---

# 46. Search Implementation

Build parameterized dynamic filters.

Example logic:

```sql
SELECT *
FROM assets
WHERE
  (asset_code LIKE ? OR
   name LIKE ? OR
   manufacturer LIKE ? OR
   model LIKE ? OR
   serial_number LIKE ? OR
   location LIKE ? OR
   custodian LIKE ?)
```

Then append other filter clauses safely.

---

# 47. Automatic Asset Code Generation

On create:

```text
AST-0001
```

Use next numeric ID logic or derive from newly inserted row.

Ensure uniqueness.

---

# 48. Timeline Ordering

Asset events:

```sql
ORDER BY created_at DESC, id DESC
```

Maintenance:

Upcoming:

```sql
ORDER BY scheduled_date ASC
```

Completed:

```sql
ORDER BY completed_date DESC
```

---

# 49. Avoid Fake Functionality

Do not add buttons that do nothing.

Any visible major action must work.

Especially:

- Add asset.
- Edit asset.
- Change lifecycle.
- Schedule maintenance.
- Complete maintenance.
- Search.
- Filters.

---

# 50. Quality Gate

Before declaring the implementation complete:

## Backend

Verify:

```text
[ ] server starts
[ ] SQLite file created
[ ] seed runs
[ ] health endpoint works
[ ] list assets works
[ ] get asset works
[ ] create asset works
[ ] update asset works
[ ] maintenance create works
[ ] maintenance completion works
[ ] dashboard works
```

## Frontend

Verify:

```text
[ ] app loads without console error
[ ] dashboard displays data
[ ] inventory loads
[ ] search works
[ ] filters work
[ ] asset detail loads
[ ] add asset works
[ ] edit asset works
[ ] lifecycle update works
[ ] maintenance works
[ ] timeline updates automatically
```

---

# 51. Priority Rule

At every decision point use:

```text
Working demo
> Complete user flow
> Data correctness
> Clear UI
> Extra features
> Fancy architecture
```

---

# 52. Definition of Done

Do not consider the task complete until:

1. React frontend launches.
2. Express server launches.
3. SQLite is persistent.
4. Seed data is visible in the frontend.
5. Asset CRUD works.
6. Search/filter works.
7. Lifecycle update works.
8. Maintenance scheduling works.
9. Maintenance completion works.
10. History events are generated automatically.
11. Dashboard is backed by real SQLite data.
12. No major visible button is fake.
13. README contains exact run commands.
14. The demo can be completed without manually editing the database.

---

# 53. Final Instruction to the Coding Agent

You are acting as the senior full-stack engineer for a time-boxed hackathon.

Do not merely describe what should be built.

**Build it.**

When something is ambiguous:

- choose the simplest reasonable implementation,
- preserve the required architecture,
- continue without unnecessary questions.

Do not stop after scaffolding or TODO comments.

Keep inspecting the running application and fixing issues until the full demo flow works.

The final deliverable must be a polished, practical, end-to-end **Infrastructure Asset Lifecycle Inventory** that can be demonstrated to judges immediately.
