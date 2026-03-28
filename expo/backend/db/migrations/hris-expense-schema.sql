-- HRIS Expense Module Schema Extension
-- Production-grade expense management with OCR, multi-currency, and ServiceNow integration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Expense categories enum
CREATE TYPE expense_category AS ENUM (
  'Meals',
  'Travel',
  'Accommodation',
  'Transportation',
  'Entertainment',
  'Office Supplies',
  'Training',
  'Communication',
  'Other'
);

-- Expense status enum
CREATE TYPE expense_status AS ENUM (
  'Draft',
  'Submitted',
  'Pending Approval',
  'Approved',
  'Rejected',
  'Reimbursed',
  'Cancelled'
);

-- Currency codes (ISO 4217)
CREATE TABLE IF NOT EXISTS public.currencies (
  code CHAR(3) PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT,
  decimal_places INTEGER DEFAULT 2
);

-- Insert common currencies
INSERT INTO public.currencies (code, name, symbol) VALUES
  ('USD', 'US Dollar', '$'),
  ('EUR', 'Euro', '€'),
  ('GBP', 'British Pound', '£'),
  ('JPY', 'Japanese Yen', '¥'),
  ('SGD', 'Singapore Dollar', 'S$'),
  ('AUD', 'Australian Dollar', 'A$'),
  ('CAD', 'Canadian Dollar', 'C$')
ON CONFLICT DO NOTHING;

-- Exchange rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_currency CHAR(3) NOT NULL REFERENCES public.currencies(code),
  to_currency CHAR(3) NOT NULL REFERENCES public.currencies(code),
  rate DECIMAL(12, 6) NOT NULL,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, effective_date)
);

-- Business trips
CREATE TABLE IF NOT EXISTS public.business_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  purpose TEXT,
  budget_amount DECIMAL(10, 2),
  budget_currency CHAR(3) DEFAULT 'USD' REFERENCES public.currencies(code),
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects for expense tagging
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_code TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  department TEXT,
  budget_amount DECIMAL(12, 2),
  budget_currency CHAR(3) DEFAULT 'USD' REFERENCES public.currencies(code),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main expenses table (extends existing)
ALTER TABLE public.expenses 
  ADD COLUMN IF NOT EXISTS expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS merchant_name TEXT,
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES public.business_trips(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS original_currency CHAR(3) REFERENCES public.currencies(code),
  ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(12, 6),
  ADD COLUMN IF NOT EXISTS expense_category expense_category,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_receipt BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS policy_violations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS delegated_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS servicenow_ticket_id TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3, 2),
  ADD COLUMN IF NOT EXISTS ocr_metadata JSONB DEFAULT '{}';

-- Expense receipts with OCR data
CREATE TABLE IF NOT EXISTS public.expense_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  ocr_extracted_text TEXT,
  ocr_extracted_data JSONB DEFAULT '{}',
  ocr_processed_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense attachments (non-receipt docs)
CREATE TABLE IF NOT EXISTS public.expense_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense approval workflow
CREATE TABLE IF NOT EXISTS public.expense_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.profiles(id),
  approval_level INTEGER DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  comments TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, approver_id, approval_level)
);

-- Expense policy rules
CREATE TABLE IF NOT EXISTS public.expense_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_name TEXT NOT NULL,
  category expense_category,
  max_amount DECIMAL(10, 2),
  currency CHAR(3) DEFAULT 'USD' REFERENCES public.currencies(code),
  requires_receipt_above DECIMAL(10, 2),
  requires_approval_above DECIMAL(10, 2),
  auto_approve_below DECIMAL(10, 2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense audit log
CREATE TABLE IF NOT EXISTS public.expense_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline expense queue
CREATE TABLE IF NOT EXISTS public.expense_offline_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  expense_data JSONB NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'Pending'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expense_receipts_expense ON public.expense_receipts(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense ON public.expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_approver ON public.expense_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_business_trips_user ON public.business_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_offline_queue_user ON public.expense_offline_queue(user_id);

-- Row Level Security Policies
ALTER TABLE public.business_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_offline_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own trips" ON public.business_trips
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view active projects" ON public.projects
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage receipts for own expenses" ON public.expense_receipts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.expenses e 
      WHERE e.id = expense_receipts.expense_id 
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can view team expenses" ON public.expenses
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = expenses.user_id
      AND p.manager_id = auth.uid()
    )
  );

CREATE POLICY "Approvers can manage approvals" ON public.expense_approvals
  FOR ALL USING (auth.uid() = approver_id);

CREATE POLICY "Users can view own audit logs" ON public.expense_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expenses e
      WHERE e.id = expense_audit_log.expense_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own offline queue" ON public.expense_offline_queue
  FOR ALL USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.calculate_expense_total(expense_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT 
    CASE 
      WHEN original_currency IS NOT NULL AND exchange_rate IS NOT NULL THEN
        original_amount * exchange_rate
      ELSE
        amount
    END INTO total
  FROM public.expenses
  WHERE id = expense_id;
  
  RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check policy violations
CREATE OR REPLACE FUNCTION public.check_expense_policy_violations(
  p_category expense_category,
  p_amount DECIMAL,
  p_currency CHAR(3),
  p_has_receipt BOOLEAN
)
RETURNS JSONB AS $$
DECLARE
  violations JSONB = '[]'::JSONB;
  policy RECORD;
BEGIN
  FOR policy IN 
    SELECT * FROM public.expense_policies 
    WHERE is_active = true 
    AND (category = p_category OR category IS NULL)
    AND currency = p_currency
  LOOP
    -- Check max amount violation
    IF policy.max_amount IS NOT NULL AND p_amount > policy.max_amount THEN
      violations = violations || jsonb_build_object(
        'type', 'max_amount_exceeded',
        'policy', policy.policy_name,
        'limit', policy.max_amount,
        'actual', p_amount
      );
    END IF;
    
    -- Check receipt requirement
    IF policy.requires_receipt_above IS NOT NULL 
       AND p_amount > policy.requires_receipt_above 
       AND NOT p_has_receipt THEN
      violations = violations || jsonb_build_object(
        'type', 'receipt_required',
        'policy', policy.policy_name,
        'threshold', policy.requires_receipt_above
      );
    END IF;
  END LOOP;
  
  RETURN violations;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log expense changes
CREATE OR REPLACE FUNCTION public.log_expense_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.expense_audit_log (
      expense_id, user_id, action, old_values, new_values
    ) VALUES (
      NEW.id,
      auth.uid(),
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.expense_audit_log (
      expense_id, user_id, action, new_values
    ) VALUES (
      NEW.id,
      auth.uid(),
      'CREATE',
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_audit_trigger
AFTER INSERT OR UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.log_expense_changes();

-- Trigger to check policy violations on expense submission
CREATE OR REPLACE FUNCTION public.check_expense_policies_on_submit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Submitted' AND OLD.status = 'Draft' THEN
    NEW.policy_violations = public.check_expense_policy_violations(
      NEW.expense_category,
      NEW.amount,
      NEW.currency,
      NEW.has_receipt
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_policy_check_trigger
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.check_expense_policies_on_submit();

-- Sample expense policies
INSERT INTO public.expense_policies (policy_name, category, max_amount, requires_receipt_above, requires_approval_above, auto_approve_below, description) VALUES
  ('Meal Policy', 'Meals', 150.00, 25.00, 100.00, 50.00, 'Standard meal expense limits'),
  ('Travel Policy', 'Travel', 5000.00, 50.00, 500.00, 200.00, 'Travel expense guidelines'),
  ('Entertainment Policy', 'Entertainment', 500.00, 0.00, 100.00, NULL, 'Client entertainment limits')
ON CONFLICT DO NOTHING;