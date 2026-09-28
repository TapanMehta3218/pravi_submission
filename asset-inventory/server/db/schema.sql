CREATE TABLE IF NOT EXISTS assets (
 id INTEGER PRIMARY KEY AUTOINCREMENT, asset_code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL,
 description TEXT, manufacturer TEXT, model TEXT, serial_number TEXT, purchase_date TEXT, purchase_cost REAL DEFAULT 0,
 supplier TEXT, warranty_expiry TEXT, expected_life_years INTEGER, location TEXT, department TEXT, custodian TEXT,
 lifecycle_stage TEXT NOT NULL DEFAULT 'PLANNED', condition TEXT NOT NULL DEFAULT 'GOOD', criticality TEXT NOT NULL DEFAULT 'MEDIUM',
 installation_date TEXT, commissioning_date TEXT, retirement_date TEXT, notes TEXT,
 created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS maintenance_records (
 id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER NOT NULL REFERENCES assets(id), maintenance_type TEXT NOT NULL,
 title TEXT NOT NULL, description TEXT, scheduled_date TEXT, completed_date TEXT, technician TEXT, vendor TEXT,
 cost REAL DEFAULT 0, status TEXT NOT NULL DEFAULT 'SCHEDULED', findings TEXT, action_taken TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS asset_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER NOT NULL REFERENCES assets(id), event_type TEXT NOT NULL, title TEXT NOT NULL,
 description TEXT, old_value TEXT, new_value TEXT, performed_by TEXT DEFAULT 'System', created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS locations (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, type TEXT, address TEXT, city TEXT, state TEXT, country TEXT DEFAULT 'India'
);
CREATE INDEX IF NOT EXISTS idx_events_asset ON asset_events(asset_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_due ON maintenance_records(status, scheduled_date);
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'ADMIN' CHECK(role IN ('ADMIN')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS auth_sessions (
 id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id);
