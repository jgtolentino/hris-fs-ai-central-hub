-- HRIS-FS-AI Central Hub Complete Database Schema
-- Modular design with HR and Finance separation but integrated workflows

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE/SHARED SCHEMAS
-- =====================================================

-- Core user profiles (shared between HR and Finance)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    mobile_number TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL CHECK (role IN ('employee', 'manager', 'hr_admin', 'finance_admin', 'super_admin')),
    department_id UUID,
    office_location TEXT,
    reporting_manager_id UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments (shared organizational structure)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    parent_department_id UUID REFERENCES public.departments(id),
    department_head_id UUID REFERENCES public.profiles(id),
    cost_center TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HR MODULE TABLES
-- =====================================================

-- Employee details (HR-specific data)
CREATE TABLE IF NOT EXISTS public.hr_employee_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id),
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    marital_status TEXT CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    nationality TEXT,
    national_id TEXT,
    passport_number TEXT,
    emergency_contact JSONB,
    permanent_address JSONB,
    current_address JSONB,
    blood_group TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employment information
CREATE TABLE IF NOT EXISTS public.hr_employment_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id),
    hire_date DATE NOT NULL,
    employment_type TEXT CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
    job_title TEXT NOT NULL,
    job_grade TEXT,
    probation_end_date DATE,
    contract_end_date DATE,
    work_location TEXT,
    work_schedule JSONB,
    resignation_date DATE,
    exit_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance/Time tracking
CREATE TABLE IF NOT EXISTS public.hr_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    office_location TEXT,
    work_from TEXT CHECK (work_from IN ('Office', 'Home', 'Client Site', 'Other')),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Leave', 'Holiday', 'Weekend')),
    geo_location JSONB,
    selfie_verification_url TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, date)
);

-- Leave management
CREATE TABLE IF NOT EXISTS public.hr_leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    days_per_year DECIMAL(4,1),
    is_carry_forward BOOLEAN DEFAULT false,
    max_carry_forward DECIMAL(4,1),
    is_encashable BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    leave_type_id UUID NOT NULL REFERENCES public.hr_leave_types(id),
    year INTEGER NOT NULL,
    entitled DECIMAL(4,1) DEFAULT 0,
    used DECIMAL(4,1) DEFAULT 0,
    balance DECIMAL(4,1) GENERATED ALWAYS AS (entitled - used) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, leave_type_id, year)
);

CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    leave_type_id UUID NOT NULL REFERENCES public.hr_leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(4,1) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approver_id UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    approver_comments TEXT,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 201 Files
CREATE TABLE IF NOT EXISTS public.hr_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES public.profiles(id),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FINANCE MODULE TABLES
-- =====================================================

-- Expense categories
CREATE TABLE IF NOT EXISTS public.finance_expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    parent_category_id UUID REFERENCES public.finance_expense_categories(id),
    gl_account_code TEXT,
    requires_receipt BOOLEAN DEFAULT true,
    auto_approve_limit DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense policies
CREATE TABLE IF NOT EXISTS public.finance_expense_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.finance_expense_categories(id),
    job_grade TEXT,
    daily_limit DECIMAL(10,2),
    monthly_limit DECIMAL(10,2),
    requires_pre_approval BOOLEAN DEFAULT false,
    auto_approve_amount DECIMAL(10,2),
    policy_rules JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main expenses table
CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_number TEXT UNIQUE NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    category_id UUID NOT NULL REFERENCES public.finance_expense_categories(id),
    merchant_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    expense_date DATE NOT NULL,
    description TEXT,
    project_code TEXT,
    cost_center TEXT,
    client_billable BOOLEAN DEFAULT false,
    receipt_url TEXT,
    receipt_data JSONB,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Paid', 'Cancelled')),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    policy_violations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash advances
CREATE TABLE IF NOT EXISTS public.finance_cash_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advance_number TEXT UNIQUE NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    purpose TEXT NOT NULL,
    project_code TEXT,
    expected_return_date DATE,
    status TEXT DEFAULT 'Requested' CHECK (status IN ('Requested', 'Approved', 'Disbursed', 'Partially_Liquidated', 'Liquidated', 'Overdue')),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,
    disbursed_at TIMESTAMPTZ,
    liquidation_deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash advance liquidations (links expenses to advances)
CREATE TABLE IF NOT EXISTS public.finance_advance_liquidations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_advance_id UUID NOT NULL REFERENCES public.finance_cash_advances(id),
    expense_id UUID NOT NULL REFERENCES public.finance_expenses(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cash_advance_id, expense_id)
);

-- Reimbursements
CREATE TABLE IF NOT EXISTS public.finance_reimbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reimbursement_number TEXT UNIQUE NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT CHECK (payment_method IN ('Bank Transfer', 'Check', 'Cash', 'Payroll')),
    bank_details JSONB,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Paid', 'Failed', 'Cancelled')),
    processed_by UUID REFERENCES public.profiles(id),
    processed_at TIMESTAMPTZ,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link expenses to reimbursements
CREATE TABLE IF NOT EXISTS public.finance_reimbursement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reimbursement_id UUID NOT NULL REFERENCES public.finance_reimbursements(id),
    expense_id UUID NOT NULL REFERENCES public.finance_expenses(id),
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reimbursement_id, expense_id)
);

-- =====================================================
-- INTEGRATION TABLES (HR + Finance)
-- =====================================================

-- Compensation (HR manages, Finance processes)
CREATE TABLE IF NOT EXISTS public.integration_compensation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    effective_date DATE NOT NULL,
    base_salary DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    pay_frequency TEXT CHECK (pay_frequency IN ('Monthly', 'Bi-weekly', 'Weekly')),
    allowances JSONB,
    deductions JSONB,
    tax_info JSONB,
    bank_account JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll runs (Finance executes, HR validates)
CREATE TABLE IF NOT EXISTS public.integration_payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'HR_Review', 'Finance_Review', 'Approved', 'Processing', 'Paid', 'Cancelled')),
    total_gross DECIMAL(12,2),
    total_deductions DECIMAL(12,2),
    total_net DECIMAL(12,2),
    hr_approved_by UUID REFERENCES public.profiles(id),
    hr_approved_at TIMESTAMPTZ,
    finance_approved_by UUID REFERENCES public.profiles(id),
    finance_approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TICKETING/REQUESTS SYSTEM (Cross-functional)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ticket_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    department TEXT CHECK (department IN ('HR', 'Finance', 'IT', 'Admin', 'General')),
    sla_hours INTEGER DEFAULT 24,
    auto_assign_to UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number TEXT UNIQUE NOT NULL,
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    category_id UUID NOT NULL REFERENCES public.ticket_categories(id),
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Assigned', 'In_Progress', 'Pending', 'Resolved', 'Closed', 'Cancelled')),
    assigned_to UUID REFERENCES public.profiles(id),
    attachments JSONB,
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUDIT & COMPLIANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- VIEWS FOR INTEGRATION
-- =====================================================

-- Employee directory view (combines HR and basic info)
CREATE OR REPLACE VIEW public.v_employee_directory AS
SELECT 
    p.id,
    p.employee_id,
    p.full_name,
    p.email,
    p.mobile_number,
    d.name as department,
    ei.job_title,
    ei.work_location,
    p.role,
    p.is_active
FROM public.profiles p
LEFT JOIN public.departments d ON p.department_id = d.id
LEFT JOIN public.hr_employment_info ei ON p.id = ei.profile_id
WHERE p.is_active = true;

-- Expense summary view (for finance dashboard)
CREATE OR REPLACE VIEW public.v_expense_summary AS
SELECT 
    e.profile_id,
    p.full_name,
    p.employee_id,
    d.name as department,
    COUNT(e.id) as total_expenses,
    SUM(e.amount) as total_amount,
    SUM(CASE WHEN e.status = 'Submitted' THEN e.amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN e.status = 'Approved' THEN e.amount ELSE 0 END) as approved_amount
FROM public.finance_expenses e
JOIN public.profiles p ON e.profile_id = p.id
LEFT JOIN public.departments d ON p.department_id = d.id
GROUP BY e.profile_id, p.full_name, p.employee_id, d.name;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_employee_id ON public.profiles(employee_id);
CREATE INDEX idx_attendance_profile_date ON public.hr_attendance(profile_id, date);
CREATE INDEX idx_expenses_profile_status ON public.finance_expenses(profile_id, status);
CREATE INDEX idx_expenses_date ON public.finance_expenses(expense_date);
CREATE INDEX idx_tickets_requester ON public.tickets(requester_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (employees see their own data)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own attendance" ON public.hr_attendance
    FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can view own expenses" ON public.finance_expenses
    FOR SELECT USING (auth.uid() = profile_id);

-- Managers can view their team's data
CREATE POLICY "Managers can view team profiles" ON public.profiles
    FOR SELECT USING (
        auth.uid() IN (
            SELECT reporting_manager_id FROM public.profiles WHERE id = profiles.id
        )
    );

-- HR admins can view all HR data
CREATE POLICY "HR admins can view all attendance" ON public.hr_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('hr_admin', 'super_admin')
        )
    );

-- Finance admins can view all finance data
CREATE POLICY "Finance admins can manage all expenses" ON public.finance_expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('finance_admin', 'super_admin')
        )
    );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-generate expense numbers
CREATE OR REPLACE FUNCTION generate_expense_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expense_number := 'EXP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('expense_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS expense_number_seq;

CREATE TRIGGER set_expense_number
    BEFORE INSERT ON public.finance_expenses
    FOR EACH ROW
    WHEN (NEW.expense_number IS NULL)
    EXECUTE FUNCTION generate_expense_number();

-- Auto-generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(nextval('ticket_number_seq')::TEXT, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq;

CREATE TRIGGER set_ticket_number
    BEFORE INSERT ON public.tickets
    FOR EACH ROW
    WHEN (NEW.ticket_number IS NULL)
    EXECUTE FUNCTION generate_ticket_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.finance_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (table_name, record_id, action, changed_by, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.finance_expenses
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_compensation AFTER INSERT OR UPDATE OR DELETE ON public.integration_compensation
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- SAMPLE DATA (Remove in production)
-- =====================================================

-- Insert sample expense categories
INSERT INTO public.finance_expense_categories (name, code, gl_account_code) VALUES
    ('Travel', 'TRVL', '5100'),
    ('Meals & Entertainment', 'MEAL', '5200'),
    ('Office Supplies', 'OFFC', '5300'),
    ('Professional Services', 'PROF', '5400'),
    ('Training & Development', 'TRNG', '5500');

-- Insert sample leave types
INSERT INTO public.hr_leave_types (name, code, days_per_year, is_carry_forward) VALUES
    ('Annual Leave', 'AL', 21, true),
    ('Sick Leave', 'SL', 14, false),
    ('Personal Leave', 'PL', 7, false),
    ('Maternity Leave', 'ML', 90, false),
    ('Paternity Leave', 'PTL', 14, false);

-- Insert sample ticket categories
INSERT INTO public.ticket_categories (name, code, department, sla_hours) VALUES
    ('IT Support', 'IT-SUP', 'IT', 4),
    ('Payroll Query', 'FIN-PAY', 'Finance', 24),
    ('Leave Request Issue', 'HR-LV', 'HR', 8),
    ('Expense Reimbursement', 'FIN-EXP', 'Finance', 48),
    ('Employee Onboarding', 'HR-ONB', 'HR', 72);

COMMENT ON SCHEMA public IS 'HRIS-FS-AI Central Hub - Integrated HR and Finance System';