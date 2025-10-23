# Maintenance Tracker - Database Schema

## Overview
This document outlines the complete database structure for the Maintenance Tracker application.

## Tables

### 1. `users` (extends Supabase auth.users)
Stores additional user information beyond Supabase authentication.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'technician', 'viewer')),
  phone TEXT,
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

**Roles:**
- `admin`: Full system access
- `supervisor`: Manage tasks and view reports
- `technician`: Execute tasks, update status
- `viewer`: Read-only access

---

### 2. `assets`
Physical items/equipment that require maintenance.

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT UNIQUE NOT NULL, -- e.g., "HVAC-001", "PUMP-A12"
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., "HVAC", "Electrical", "Plumbing"
  location TEXT NOT NULL, -- Building/Floor/Room
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE,
  installation_date DATE,
  warranty_expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'out_of_service', 'retired')),
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  image_url TEXT,
  qr_code TEXT, -- For QR code scanning
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assets_category ON assets(category);
CREATE INDEX idx_assets_location ON assets(location);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_assets_asset_code ON assets(asset_code);
```

---

### 3. `maintenance_schedules`
Defines recurring maintenance patterns for assets.

```sql
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'predictive', 'corrective', 'inspection')),
  frequency_type TEXT NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'custom')),
  frequency_value INTEGER, -- For custom frequencies (e.g., every X days)
  estimated_duration_minutes INTEGER,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id),
  instructions TEXT,
  checklist JSONB, -- Array of checklist items
  required_parts JSONB, -- Array of parts needed
  is_active BOOLEAN DEFAULT true,
  next_due_date DATE,
  last_completed_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maintenance_schedules_asset_id ON maintenance_schedules(asset_id);
CREATE INDEX idx_maintenance_schedules_next_due_date ON maintenance_schedules(next_due_date);
CREATE INDEX idx_maintenance_schedules_assigned_to ON maintenance_schedules(assigned_to);
CREATE INDEX idx_maintenance_schedules_is_active ON maintenance_schedules(is_active);
```

---

### 4. `maintenance_tasks`
Individual task instances generated from schedules or created ad-hoc.

```sql
CREATE TABLE maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_number TEXT UNIQUE NOT NULL, -- Auto-generated: TASK-2025-0001
  schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('scheduled', 'emergency', 'corrective', 'inspection')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE NOT NULL,
  scheduled_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES users(id),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  instructions TEXT,
  checklist JSONB, -- With completion status
  notes TEXT,
  completion_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maintenance_tasks_asset_id ON maintenance_tasks(asset_id);
CREATE INDEX idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX idx_maintenance_tasks_assigned_to ON maintenance_tasks(assigned_to);
CREATE INDEX idx_maintenance_tasks_due_date ON maintenance_tasks(due_date);
CREATE INDEX idx_maintenance_tasks_task_number ON maintenance_tasks(task_number);
```

---

### 5. `task_logs`
Detailed activity log for each task.

```sql
CREATE TABLE task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- e.g., "status_changed", "assigned", "note_added", "started", "completed"
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_created_at ON task_logs(created_at);
```

---

### 6. `parts_inventory`
Spare parts and materials inventory.

```sql
CREATE TABLE parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit_of_measure TEXT, -- e.g., "piece", "meter", "liter"
  quantity_on_hand INTEGER DEFAULT 0,
  minimum_quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10, 2),
  supplier TEXT,
  location TEXT, -- Storage location
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_parts_inventory_part_number ON parts_inventory(part_number);
CREATE INDEX idx_parts_inventory_category ON parts_inventory(category);
```

---

### 7. `task_parts_used`
Track parts used in maintenance tasks.

```sql
CREATE TABLE task_parts_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts_inventory(id),
  quantity_used INTEGER NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_parts_used_task_id ON task_parts_used(task_id);
CREATE INDEX idx_task_parts_used_part_id ON task_parts_used(part_id);
```

---

### 8. `work_orders`
Optional: Group multiple tasks into work orders.

```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_number TEXT UNIQUE NOT NULL, -- WO-2025-0001
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  requested_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_wo_number ON work_orders(wo_number);
```

---

### 9. `attachments`
Store file attachments for tasks and assets.

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'asset', 'work_order')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT, -- MIME type
  file_size INTEGER, -- in bytes
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
```

---

### 10. `notifications`
User notifications for task updates.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT CHECK (type IN ('task_assigned', 'task_due', 'task_overdue', 'task_completed', 'general')),
  related_entity_type TEXT, -- 'task', 'asset', etc.
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

---

## Row Level Security (RLS) Policies

### Enable RLS on all tables:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_parts_used ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Example Policies:

```sql
-- Users can view all users
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

-- Only admins can insert/update users
CREATE POLICY "Only admins can modify users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Everyone can view active assets
CREATE POLICY "Everyone can view active assets" ON assets
  FOR SELECT USING (status != 'retired');

-- Technicians can view their assigned tasks
CREATE POLICY "Users can view their tasks" ON maintenance_tasks
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Users can only read their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
```

---

## Functions & Triggers

### Auto-update `updated_at` timestamp:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all relevant tables)
```

### Auto-generate task numbers:
```sql
CREATE OR REPLACE FUNCTION generate_task_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_number IS NULL THEN
    NEW.task_number := 'TASK-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
      LPAD(NEXTVAL('task_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE task_number_seq;

CREATE TRIGGER set_task_number BEFORE INSERT ON maintenance_tasks
  FOR EACH ROW EXECUTE FUNCTION generate_task_number();
```

---

## Views for Reporting

### Overdue tasks view:
```sql
CREATE VIEW overdue_tasks AS
SELECT 
  t.*,
  a.name as asset_name,
  a.location,
  u.full_name as assigned_to_name
FROM maintenance_tasks t
JOIN assets a ON t.asset_id = a.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.status NOT IN ('completed', 'cancelled')
  AND t.due_date < CURRENT_DATE;
```

### Asset maintenance history:
```sql
CREATE VIEW asset_maintenance_history AS
SELECT 
  a.id as asset_id,
  a.name as asset_name,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  MAX(t.completed_at) as last_maintenance_date,
  AVG(CASE WHEN t.status = 'completed' THEN t.actual_duration_minutes END) as avg_duration
FROM assets a
LEFT JOIN maintenance_tasks t ON a.id = t.asset_id
GROUP BY a.id, a.name;
```

---

## Data Relationships Summary

```
users (1) ----< (N) maintenance_tasks [assigned_to]
users (1) ----< (N) maintenance_schedules [assigned_to]
users (1) ----< (N) notifications

assets (1) ----< (N) maintenance_schedules
assets (1) ----< (N) maintenance_tasks
assets (1) ----< (N) attachments

maintenance_schedules (1) ----< (N) maintenance_tasks

maintenance_tasks (1) ----< (N) task_logs
maintenance_tasks (1) ----< (N) task_parts_used
maintenance_tasks (1) ----< (N) attachments

parts_inventory (1) ----< (N) task_parts_used
```

---

## Next Steps

1. Create tables in Supabase SQL Editor
2. Set up RLS policies
3. Create necessary indexes
4. Set up triggers for auto-generated fields
5. Create views for reporting
6. Test with sample data
