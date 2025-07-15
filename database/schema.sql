-- TBWA Expense Management Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100),
  manager_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense categories
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  category VARCHAR(50) NOT NULL,
  merchant VARCHAR(255) NOT NULL,
  description TEXT,
  receipt_url TEXT,
  date DATE NOT NULL,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'reimbursed')),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reimbursed_at TIMESTAMPTZ,
  reimbursement_reference VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_expenses_user_id (user_id),
  INDEX idx_expenses_status (status),
  INDEX idx_expenses_date (date DESC)
);

-- Expense attachments (for multiple receipts)
CREATE TABLE IF NOT EXISTS public.expense_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense comments/notes
CREATE TABLE IF NOT EXISTS public.expense_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense policies
CREATE TABLE IF NOT EXISTS public.expense_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(50) NOT NULL,
  max_amount DECIMAL(10,2),
  requires_receipt BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  auto_approve_under DECIMAL(10,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget tracking
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  department VARCHAR(100),
  category VARCHAR(50),
  monthly_limit DECIMAL(10,2) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_budget UNIQUE (user_id, department, category, year, month)
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view own expenses" ON public.expenses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own expenses" ON public.expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft expenses" ON public.expenses
  FOR UPDATE USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Users can delete own draft expenses" ON public.expenses
  FOR DELETE USING (user_id = auth.uid() AND status = 'draft');

CREATE POLICY "Managers can view team expenses" ON public.expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.manager_id = auth.uid()
      AND profiles.id = expenses.user_id
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.expense_categories (name, code, icon) VALUES
  ('Meals & Entertainment', 'meals', '🍽️'),
  ('Transportation', 'transport', '🚗'),
  ('Accommodation', 'accommodation', '🏨'),
  ('Office Supplies', 'office', '📎'),
  ('Client Meeting', 'client', '🤝'),
  ('Training & Education', 'training', '📚'),
  ('Communication', 'communication', '📱'),
  ('Other', 'other', '📋')
ON CONFLICT (code) DO NOTHING;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- TIMEKEEPING TABLES

-- Time entries (clock in/out)
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  clock_in_location JSONB,
  clock_out_location JSONB,
  clock_in_selfie_url TEXT,
  clock_out_selfie_url TEXT,
  total_hours DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN clock_out IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600.0
      ELSE NULL
    END
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_time_entries_user_id (user_id),
  INDEX idx_time_entries_clock_in (clock_in DESC)
);

-- Time adjustments
CREATE TABLE IF NOT EXISTS public.time_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  time_entry_id UUID REFERENCES public.time_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  adjustment_hours DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work schedules
CREATE TABLE IF NOT EXISTS public.work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_schedule UNIQUE (user_id, day_of_week)
);

-- TICKETING SYSTEM TABLES

-- Ticket categories
CREATE TABLE IF NOT EXISTS public.ticket_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10),
  description TEXT,
  default_assignee_group VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in-progress', 'pending', 'resolved', 'closed', 'cancelled')),
  
  -- Assignment
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ,
  assigned_group VARCHAR(100),
  
  -- Resolution
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  
  INDEX idx_tickets_user_id (user_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_priority (priority),
  INDEX idx_tickets_number (ticket_number)
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket attachments
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for timekeeping
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own active time entries" ON public.time_entries
  FOR UPDATE USING (user_id = auth.uid() AND clock_out IS NULL);

-- RLS Policies for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets" ON public.tickets
  FOR SELECT USING (user_id = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets" ON public.tickets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view comments on their tickets" ON public.ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.user_id = auth.uid() OR tickets.assigned_to = auth.uid())
    )
  );

-- Seed ticket categories
INSERT INTO public.ticket_categories (name, code, icon, default_assignee_group) VALUES
  ('IT Support', 'it', '💻', 'IT'),
  ('HR', 'hr', '👥', 'HR'),
  ('Expense', 'expense', '💰', 'Finance'),
  ('Facilities', 'facilities', '🏢', 'Facilities'),
  ('Other', 'other', '📋', 'General')
ON CONFLICT (code) DO NOTHING;

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'INC' || LPAD(nextval('ticket_number_seq')::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('selfies', 'selfies', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;