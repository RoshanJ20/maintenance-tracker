-- Maintenance Tracker - Current Database Schema
-- This is the ACTUAL schema currently in production

-- =======================
-- HELPER FUNCTIONS
-- =======================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- TABLES
-- =======================

-- Users table
CREATE TABLE public.users (
  id UUID NOT NULL,
  role TEXT NOT NULL,
  name TEXT NULL,
  email TEXT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_check CHECK (
    role = ANY (ARRAY['admin'::TEXT, 'maintainer'::TEXT])
  )
) TABLESPACE pg_default;

-- Assets table
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NULL,
  purchasedate DATE NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT assets_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  asset_id UUID NULL,
  task_name TEXT NOT NULL,
  last_done_date DATE NULL,
  next_due_date DATE NULL,
  frequency_days INTEGER NULL,
  notified BOOLEAN NULL DEFAULT false,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT maintenance_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_tasks_asset_id_fkey FOREIGN KEY (asset_id) 
    REFERENCES assets (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- =======================
-- TRIGGERS
-- =======================

-- Auto-update updated_at on assets
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON assets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on tasks
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- INDEXES (Optional - Add as needed)
-- =======================

-- Users indexes
-- CREATE INDEX idx_users_role ON users(role);

-- Assets indexes
-- CREATE INDEX idx_assets_type ON assets(type);
-- CREATE INDEX idx_assets_created_at ON assets(created_at);

-- Tasks indexes
-- CREATE INDEX idx_tasks_asset_id ON tasks(asset_id);
-- CREATE INDEX idx_tasks_next_due_date ON tasks(next_due_date);
-- CREATE INDEX idx_tasks_notified ON tasks(notified);
-- CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- =======================
-- ROW LEVEL SECURITY (RLS)
-- =======================

-- Enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Example policies (uncomment when needed):
/*
-- Users can view all users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

-- Only admins can modify users
CREATE POLICY "Only admins can modify users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Everyone can view assets
CREATE POLICY "Everyone can view assets" ON assets
  FOR SELECT USING (true);

-- Admins and maintainers can modify assets
CREATE POLICY "Maintainers can modify assets" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'maintainer')
    )
  );
*/

-- =======================
-- NOTES
-- =======================

-- All tables are now created and ready to use!
-- The tasks table uses frequency-based scheduling:
--   - frequency_days: How often the task should repeat
--   - last_done_date: When it was last completed
--   - next_due_date: When it's due next
--   - notified: Whether user has been notified about upcoming/overdue task

-- Future enhancements could include:
--   - assigned_to field for user assignments
--   - status field (pending, in_progress, completed)
--   - priority field
--   - checklist field (JSONB)
