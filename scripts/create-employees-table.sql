-- Create hr_admin schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS hr_admin;

-- Create employees table in hr_admin schema
CREATE TABLE IF NOT EXISTS hr_admin.employees (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Unique identifiers
    employee_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    
    -- Employee information
    full_name TEXT NOT NULL,
    department_id UUID,
    position_id UUID,
    hire_date DATE NOT NULL,
    
    -- Status with check constraint
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'terminated')),
    
    -- Face encoding for face recognition (JSONB)
    face_encoding JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_employees_employee_id ON hr_admin.employees(employee_id);
CREATE INDEX idx_employees_email ON hr_admin.employees(email);
CREATE INDEX idx_employees_department_id ON hr_admin.employees(department_id);
CREATE INDEX idx_employees_position_id ON hr_admin.employees(position_id);
CREATE INDEX idx_employees_status ON hr_admin.employees(status);
CREATE INDEX idx_employees_hire_date ON hr_admin.employees(hire_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION hr_admin.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON hr_admin.employees 
    FOR EACH ROW 
    EXECUTE FUNCTION hr_admin.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE hr_admin.employees IS 'Main employees table storing all employee information including face recognition data';
COMMENT ON COLUMN hr_admin.employees.id IS 'Primary key - UUID automatically generated';
COMMENT ON COLUMN hr_admin.employees.employee_id IS 'Unique employee identifier (e.g., EMP001)';
COMMENT ON COLUMN hr_admin.employees.email IS 'Employee email address - must be unique';
COMMENT ON COLUMN hr_admin.employees.full_name IS 'Employee full name';
COMMENT ON COLUMN hr_admin.employees.department_id IS 'Foreign key reference to departments table';
COMMENT ON COLUMN hr_admin.employees.position_id IS 'Foreign key reference to positions table';
COMMENT ON COLUMN hr_admin.employees.hire_date IS 'Date when employee was hired';
COMMENT ON COLUMN hr_admin.employees.status IS 'Employee status - active, inactive, or terminated';
COMMENT ON COLUMN hr_admin.employees.face_encoding IS 'Face recognition encoding data stored as JSONB';
COMMENT ON COLUMN hr_admin.employees.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN hr_admin.employees.updated_at IS 'Timestamp when record was last updated';

-- Grant appropriate permissions (adjust as needed)
-- Example: GRANT SELECT, INSERT, UPDATE ON hr_admin.employees TO authenticated;