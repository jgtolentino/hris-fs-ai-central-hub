-- Verify hr_admin schema exists
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata 
WHERE schema_name = 'hr_admin';

-- Verify employees table exists and show its structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'hr_admin' 
    AND table_name = 'employees'
ORDER BY ordinal_position;

-- Show all constraints on the employees table
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_schema = 'hr_admin' 
    AND table_name = 'employees';

-- Show indexes on the employees table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'hr_admin' 
    AND tablename = 'employees';

-- Show triggers on the employees table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'hr_admin' 
    AND event_object_table = 'employees';

-- Test insert (optional - uncomment to test)
-- INSERT INTO hr_admin.employees (
--     employee_id, 
--     email, 
--     full_name, 
--     hire_date, 
--     status
-- ) VALUES (
--     'EMP001',
--     'john.doe@company.com',
--     'John Doe',
--     '2024-01-15',
--     'active'
-- ) RETURNING *;