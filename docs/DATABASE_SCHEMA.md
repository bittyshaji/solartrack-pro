# SolarTrack Pro - Database Schema

**PostgreSQL table structure and relationships**

## Overview

```
user_profiles (1) ----< (many) projects
    |
    +--- customers
    |
    +--- materials
    |
    +--- invoices

customers (1) ----< (many) projects
                        |
                        +--- project_photos
                        |
                        +--- project_tasks
                        |
                        +--- estimates
                        |
                        +--- invoices
```

---

## Tables

### user_profiles

User account and profile data

```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE,
  first_name varchar(50),
  last_name varchar(50),
  company_name varchar(100),
  phone varchar(20),
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_name);
CREATE INDEX idx_user_profiles_approval ON user_profiles(approval_status);
```

**Rows**: ~100s  
**Used By**: Authentication, authorization, team management

### customers

Customer/company records

```sql
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(20),
  street_address varchar(255),
  city varchar(100),
  state varchar(50),
  zip_code varchar(10),
  industry varchar(100),
  notes text,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_created_by ON customers(created_by);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_company ON customers(company_name);
```

**Rows**: 100s-1000s  
**Used By**: Project creation, billing, contact management

### projects

Solar project records

```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  title varchar(255) NOT NULL,
  description text,
  status text DEFAULT 'lead' CHECK (
    status IN ('lead', 'quoted', 'approved', 'in_progress', 'completed')
  ),
  stage varchar(50),
  location varchar(255),
  street_address varchar(255),
  city varchar(100),
  state varchar(50),
  zip_code varchar(10),
  solar_capacity_kw decimal(10, 2),
  estimated_savings decimal(12, 2),
  contract_value decimal(12, 2),
  start_date date,
  completion_date date,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

**Rows**: 100s-10000s  
**Used By**: Dashboard, reporting, project management

### project_photos

Photos associated with projects

```sql
CREATE TABLE project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  stage varchar(50),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_project_photos_project ON project_photos(project_id);
CREATE INDEX idx_project_photos_created_at ON project_photos(created_at DESC);
```

**Rows**: 1000s-10000s  
**Storage**: Stored in Supabase Storage bucket

### project_tasks

Tasks and milestones for projects

```sql
CREATE TABLE project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  due_date date,
  assigned_to uuid REFERENCES user_profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);
CREATE INDEX idx_project_tasks_assigned_to ON project_tasks(assigned_to);
```

### materials

Material/product catalog

```sql
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  category varchar(100),
  description text,
  unit_price decimal(10, 2),
  unit varchar(50),
  supplier varchar(255),
  part_number varchar(100),
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_materials_created_by ON materials(created_by);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_name ON materials(name);
```

### estimates

Project quotes/estimates

```sql
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_number varchar(50) NOT NULL UNIQUE,
  title varchar(255),
  description text,
  total_amount decimal(12, 2),
  status text DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')
  ),
  valid_until date,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_number ON estimates(estimate_number);
```

### invoices

Billing/payment records

```sql
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  estimate_id uuid REFERENCES estimates(id),
  invoice_number varchar(50) NOT NULL UNIQUE,
  total_amount decimal(12, 2),
  paid_amount decimal(12, 2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')
  ),
  due_date date,
  issued_date date DEFAULT CURRENT_DATE,
  paid_date date,
  created_by uuid NOT NULL REFERENCES user_profiles(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_project ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
```

---

## Row-Level Security (RLS)

Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ... etc

-- User profiles: Users see their own profile
CREATE POLICY "Users view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Customers: Users see customers they created
CREATE POLICY "Users view own customers"
  ON customers FOR SELECT
  USING (created_by = auth.uid());

-- Projects: Users see projects they created or are members of
CREATE POLICY "Users view own projects"
  ON projects FOR SELECT
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Materials: Users see materials they created
CREATE POLICY "Users view own materials"
  ON materials FOR SELECT
  USING (created_by = auth.uid());
```

---

## Data Types

| Type | Usage | Example |
|------|-------|---------|
| uuid | Primary keys, foreign keys | `gen_random_uuid()` |
| text | Long strings, unrestricted | Descriptions, notes |
| varchar(n) | Fixed-length strings | Names, emails, addresses |
| decimal(p,s) | Money amounts | Prices, totals |
| date | Dates without time | Birthdate, due date |
| timestamp | Audit trail | created_at, updated_at |
| boolean | True/false | is_active, is_approved |
| json | Complex data | Address, metadata |

---

## Common Queries

### Get projects with customer info

```sql
SELECT p.*, c.company_name
FROM projects p
JOIN customers c ON p.customer_id = c.id
WHERE p.created_by = auth.uid()
ORDER BY p.created_at DESC;
```

### Get customer projects count

```sql
SELECT c.id, c.company_name, COUNT(p.id) as project_count
FROM customers c
LEFT JOIN projects p ON c.id = p.customer_id
WHERE c.created_by = auth.uid()
GROUP BY c.id, c.company_name;
```

### Get revenue by project status

```sql
SELECT 
  p.status,
  COUNT(*) as count,
  SUM(p.contract_value) as total_value
FROM projects p
WHERE p.created_by = auth.uid()
GROUP BY p.status;
```

---

## Performance Considerations

### Indexed Columns

- Foreign keys (created_by, customer_id, project_id)
- Status fields (frequently filtered)
- Date fields (frequently sorted)
- Email (unique lookups)
- Names (frequently searched)

### Query Optimization

- Always filter by user in RLS policies
- Use pagination for large result sets
- Select only needed columns
- Join efficiently
- Monitor slow queries in Supabase dashboard

---

## Backups & Maintenance

Supabase handles:
- Daily automated backups
- Point-in-time recovery
- Encryption at rest
- Regular updates

Manual checks:
- Monitor disk usage
- Review query logs
- Test restore procedures
- Archive old data

---

## Migration & Schema Changes

Use Supabase Migrations:

```bash
# Pull latest schema
supabase db pull

# Create migration
supabase migration new add_new_field

# Edit migration file in migrations/
# Then push to database
supabase db push
```

---

## See Also

- [SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) - Data models
- [API_REFERENCE.md](./API_REFERENCE.md) - How to query
- [Supabase Docs](https://supabase.com/docs)
