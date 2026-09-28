# Infrastructure Asset Lifecycle Inventory — System Architecture

## 1. System Overview & High-Level Architecture Diagram

The **Infrastructure Asset Lifecycle Inventory System** is a full-stack, cloud-ready CMMS (Computerized Maintenance Management System) built for enterprise tracking of physical and digital assets across their entire operational lifecycle (Planned → Procured → Received → Installed → Operational → Under Maintenance → End of Life → Retired).

```mermaid
graph TD
    subgraph Client ["Frontend Layer (Vite + React)"]
        UI["React 19 SPA"]
        Router["React Router v7"]
        Charts["Recharts (Metrics & Visualizations)"]
        Icons["Lucide React Icons"]
        ApiClient["REST API Client (Fetch + CSRF)"]
    end

    subgraph Hosting ["Vercel Serverless Infrastructure"]
        VercelCDN["Vercel Edge Network / CDN"]
        ServerlessFunc["Vercel Serverless Function (/api)"]
    end

    subgraph Backend ["Backend API Layer (Node.js + Express)"]
        AuthMw["Security & Auth Middleware (JWT + CSRF + Rate Limit)"]
        AssetCtrl["Asset Inventory Controller"]
        MaintCtrl["Maintenance Scheduler Controller"]
        EventCtrl["Lifecycle & Event Audit Controller"]
        AssistantCtrl["AI Asset Assistant (Groq + LangChain)"]
    end

    subgraph Data ["Data Storage & External Services"]
        MongoDB[("MongoDB Atlas (Cloud NoSQL DB)")]
        SQLite[("SQLite / In-Memory (Dev Fallback)")]
        GroqAPI["Groq LLM API"]
    end

    UI --> Router
    UI --> Charts
    UI --> ApiClient
    ApiClient -- "HTTPS / REST API" --> VercelCDN
    VercelCDN --> ServerlessFunc
    ServerlessFunc --> AuthMw
    AuthMw --> AssetCtrl
    AuthMw --> MaintCtrl
    AuthMw --> EventCtrl
    AuthMw --> AssistantCtrl

    AssetCtrl --> MongoDB
    MaintCtrl --> MongoDB
    EventCtrl --> MongoDB
    AssetCtrl -. "Fallback" .-> SQLite
    AssistantCtrl -- "Natural Language Queries" --> GroqAPI
```

---

## 2. Component Architecture Breakdown

### 2.1 Presentation & User Interface (Client)
- **Framework**: React 19 + Vite 6
- **Routing**: React Router v7 (`/`, `/assets`, `/assets/:id`, `/maintenance`, `/locations`)
- **Design System**: Tailwind CSS v4, dark/light modern dashboard aesthetic
- **Charts & Data Visualization**: Recharts for lifecycle distribution, condition breakdown, and financial asset valuation
- **Security Headers**: Standardized request wrapper sending `X-Requested-With: InfraTrack` security headers and CSRF tokens.

### 2.2 Server & API Services (Backend)
- **Runtime**: Node.js ES Modules with Express 5
- **Serverless Hosting**: Optimized Vercel entry point (`api/index.js`) wrapping Express middleware
- **Authentication**: JWT token in HTTP-only cookies, session management, and rate limiting (`express-rate-limit`)
- **API Endpoints**:
  - `GET /api/dashboard`: Aggregated executive operational stats, warranty alerts, and due maintenance
  - `GET /api/assets`, `POST /api/assets`, `PUT /api/assets/:id`: Complete Asset CRUD operations
  - `PATCH /api/assets/:id/lifecycle`: Immutable lifecycle state transitions with automatic audit event creation
  - `GET/POST/PUT /api/maintenance`: Maintenance job scheduling, assignment, and completion workflow
  - `POST /api/assistant`: Natural language querying powered by Groq LLM

### 2.3 Data Storage & Database Architecture
- **Primary Database**: MongoDB Atlas via Mongoose ORM
  - `assets`: Primary asset records with purchase costs, condition, criticality, warranty, and custodian metadata
  - `maintenancerecords`: Preventive & corrective maintenance tasks with technician, cost, and completion tracking
  - `assetevents`: Immutable timeline history for every asset state change
  - `locations`: Physical/logical site definitions and aggregated valuation
- **Embedded Fallback**: `better-sqlite3` with in-memory fallback for offline/development environments

---

## 3. Data Flow & Lifecycle Event Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Inventory Manager
    participant UI as React Frontend
    participant Server as Express API Server
    participant DB as MongoDB / Database
    
    User->>UI: Update Asset Lifecycle Stage (e.g. INSTALLED → OPERATIONAL)
    UI->>Server: PATCH /api/assets/:id/lifecycle { stage: 'OPERATIONAL' }
    Server->>Server: Verify Auth & CSRF Security Header
    Server->>DB: Fetch current asset record
    Server->>DB: Update asset lifecycle_stage = 'OPERATIONAL'
    Server->>DB: INSERT asset_event (Type: STATUS_CHANGED, Old: INSTALLED, New: OPERATIONAL)
    DB-->>Server: Updated Record & Event Confirmation
    Server-->>UI: 200 OK + Updated Asset JSON
    UI-->>User: Update Timeline UI & Display Status Badge
```

---

## 4. Maintenance & Audit Timeline Workflow

```mermaid
flowchart LR
    A[Planned Asset] --> B[Procured & Received]
    B --> C[Installed at Site]
    C --> D[Operational]
    D -->|Preventive/Corrective| E[Under Maintenance]
    E -->|Maintenance Complete| D
    D -->|Reached Useful Life| F[Approaching End of Life]
    F --> G[Retired / Disposed]

    style D fill:#22c55e,color:#fff
    style E fill:#eab308,color:#fff
    style G fill:#ef4444,color:#fff
```

---

## 5. Deployment Topology (Vercel Cloud Deployment)

```mermaid
graph LR
    subgraph Users ["Client Browsers"]
        Laptop["Desktop Browser"]
        Mobile["Mobile / Tablet"]
    end

    subgraph Edge ["Vercel Edge Network"]
        DNS["Vercel Anycast DNS"]
        SSL["TLS / SSL Termination"]
        StaticAssets["Static Frontend (client/dist)"]
    end

    subgraph Compute ["Vercel Serverless Engine"]
        ApiFunction["Node.js Serverless Function (/api/index.js)"]
    end

    subgraph CloudDB ["Database Cloud"]
        Atlas["MongoDB Atlas Cluster"]
    end

    Users --> DNS
    DNS --> SSL
    SSL --> StaticAssets
    SSL --> ApiFunction
    ApiFunction -- "Encrypted Mongoose Connection" --> Atlas
```

---

## 6. Summary of Key Technologies

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite 6, React Router v7 |
| **Styling & UI** | Tailwind CSS v4, Lucide React Icons |
| **Charts & Metrics** | Recharts |
| **Backend API** | Node.js (ES Modules), Express 5 |
| **Database** | MongoDB Atlas (Mongoose ORM) & SQLite Fallback |
| **AI Integration** | Groq AI API (`@langchain/groq`) |
| **Deployment Platform** | Vercel (Serverless Functions & Edge Network) |
