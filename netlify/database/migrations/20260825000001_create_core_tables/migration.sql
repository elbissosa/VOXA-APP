-- Tablas principales de VOXA

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  podcast_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'inicial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  max_cameras INTEGER NOT NULL,
  max_destinations INTEGER NOT NULL,
  locked_sections TEXT[] DEFAULT '{}',
  locked_buttons TEXT[] DEFAULT '{}',
  stripe_price_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Datos iniciales de planes
INSERT INTO plans (slug, name, price_cents, max_cameras, max_destinations, locked_sections, locked_buttons, active)
VALUES
  ('inicial', 'Inicial', 999, 2, 1, ARRAY['panelVideoPro','panelAIInterview','panelOverlayEditor','panelReplayLibrary'], ARRAY[]::TEXT[], TRUE),
  ('creador', 'Creador', 2499, 5, 3, ARRAY['panelVideoPro','panelAIInterview'], ARRAY[]::TEXT[], TRUE),
  ('estudio_pro', 'Estudio Pro', 5999, 5, 3, ARRAY[]::TEXT[], ARRAY[]::TEXT[], TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Configuración inicial del sistema
INSERT INTO system_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('system_online', 'true')
ON CONFLICT (key) DO NOTHING;
