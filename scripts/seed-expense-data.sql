-- Comprehensive Expense Seed Data
-- Covers ALL scenarios: Draft, Submitted, Approved, Rejected, Reimbursed
-- NO empty states, NO dead ends - full testing coverage

-- ============================================
-- 1. USERS (Employees + Managers)
-- ============================================

-- Create test users (if not exists)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'employee1@company.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'employee2@company.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'manager1@company.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'admin@company.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create employee profiles
INSERT INTO public.employees (id, user_id, email, first_name, last_name, department, position, manager_id)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'employee1@company.com', 'John', 'Smith', 'Sales', 'Account Executive', 'e3333333-3333-3333-3333-333333333333'),
  ('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'employee2@company.com', 'Sarah', 'Johnson', 'Marketing', 'Marketing Manager', 'e3333333-3333-3333-3333-333333333333'),
  ('e3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'manager1@company.com', 'Michael', 'Chen', 'Operations', 'Director', NULL),
  ('e4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'admin@company.com', 'Admin', 'User', 'IT', 'System Admin', NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. EXPENSE CATEGORIES
-- ============================================

INSERT INTO te.expense_categories (id, name, description, requires_receipt, max_amount)
VALUES
  ('cat-meals', 'Meals', 'Business meals and entertainment', true, 100.00),
  ('cat-travel', 'Travel', 'Flights, trains, transportation', true, 2000.00),
  ('cat-accommodation', 'Accommodation', 'Hotels and lodging', true, 500.00),
  ('cat-office', 'Office Supplies', 'Stationery and supplies', false, 200.00),
  ('cat-transport', 'Transportation', 'Taxi, Uber, local transport', true, 150.00),
  ('cat-training', 'Training', 'Courses and conferences', true, 1000.00),
  ('cat-communication', 'Communication', 'Phone and internet', false, 100.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. EXPENSES - ALL SCENARIOS
-- ============================================

-- DRAFT Expenses (saved but not submitted)
INSERT INTO te.expenses (id, user_id, employee_id, category_id, merchant_name, amount, currency, expense_date, description, status, receipt_url, created_at, updated_at)
VALUES
  ('exp-draft-001', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-meals', 'Starbucks', 12.50, 'USD', CURRENT_DATE - INTERVAL '1 day', 'Coffee with client', 'draft', 'receipts/11111111-1111-1111-1111-111111111111/receipt-001.jpg', NOW(), NOW()),
  ('exp-draft-002', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-transport', 'Uber', 25.00, 'USD', CURRENT_DATE - INTERVAL '2 days', 'Ride to airport', 'draft', NULL, NOW(), NOW());

-- SUBMITTED Expenses (pending manager approval)
INSERT INTO te.expenses (id, user_id, employee_id, category_id, merchant_name, amount, currency, expense_date, description, status, receipt_url, submitted_at, created_at, updated_at)
VALUES
  ('exp-submitted-001', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-meals', 'Restaurant ABC', 85.00, 'USD', CURRENT_DATE - INTERVAL '3 days', 'Client dinner', 'submitted', 'receipts/11111111-1111-1111-1111-111111111111/receipt-002.jpg', NOW() - INTERVAL '1 hour', NOW(), NOW()),
  ('exp-submitted-002', '22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'cat-accommodation', 'Hilton Hotel', 189.99, 'USD', CURRENT_DATE - INTERVAL '5 days', '1 night stay for conference', 'submitted', 'receipts/22222222-2222-2222-2222-222222222222/receipt-003.jpg', NOW() - INTERVAL '2 hours', NOW(), NOW()),
  ('exp-submitted-003', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-office', 'Office Depot', 45.67, 'USD', CURRENT_DATE - INTERVAL '1 day', 'Office supplies', 'submitted', 'receipts/11111111-1111-1111-1111-111111111111/receipt-004.jpg', NOW() - INTERVAL '30 minutes', NOW(), NOW());

-- APPROVED Expenses (approved, pending reimbursement)
INSERT INTO te.expenses (id, user_id, employee_id, category_id, merchant_name, amount, currency, expense_date, description, status, receipt_url, submitted_at, approved_at, approved_by, created_at, updated_at)
VALUES
  ('exp-approved-001', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-travel', 'Cebu Pacific', 350.00, 'USD', CURRENT_DATE - INTERVAL '10 days', 'Flight to Manila for meeting', 'approved', 'receipts/11111111-1111-1111-1111-111111111111/receipt-005.jpg', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 'e3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('exp-approved-002', '22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'cat-training', 'Conference Fee', 500.00, 'USD', CURRENT_DATE - INTERVAL '15 days', 'Marketing Summit 2025', 'approved', 'receipts/22222222-2222-2222-2222-222222222222/receipt-006.jpg', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 'e3333333-3333-3333-3333-333333333333', NOW(), NOW());

-- REJECTED Expenses (rejected by manager)
INSERT INTO te.expenses (id, user_id, employee_id, category_id, merchant_name, amount, currency, expense_date, description, status, receipt_url, submitted_at, rejected_at, rejected_by, rejection_reason, created_at, updated_at)
VALUES
  ('exp-rejected-001', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-meals', 'Expensive Restaurant', 250.00, 'USD', CURRENT_DATE - INTERVAL '7 days', 'Team lunch', 'rejected', 'receipts/11111111-1111-1111-1111-111111111111/receipt-007.jpg', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'e3333333-3333-3333-3333-333333333333', 'Amount exceeds policy limit for meals ($100). Please submit individual receipts.', NOW(), NOW());

-- REIMBURSED Expenses (fully processed)
INSERT INTO te.expenses (id, user_id, employee_id, category_id, merchant_name, amount, currency, expense_date, description, status, receipt_url, submitted_at, approved_at, approved_by, reimbursed_at, created_at, updated_at)
VALUES
  ('exp-reimbursed-001', '11111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'cat-transport', 'Grab', 15.00, 'USD', CURRENT_DATE - INTERVAL '20 days', 'Client visit', 'reimbursed', 'receipts/11111111-1111-1111-1111-111111111111/receipt-008.jpg', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', 'e3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '10 days', NOW(), NOW()),
  ('exp-reimbursed-002', '22222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'cat-communication', 'Globe Telecom', 50.00, 'USD', CURRENT_DATE - INTERVAL '30 days', 'Monthly mobile bill', 'reimbursed', NULL, NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days', 'e3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '20 days', NOW(), NOW());

-- ============================================
-- 4. POLICY VIOLATIONS
-- ============================================

INSERT INTO te.expense_violations (id, expense_id, violation_type, description, severity, created_at)
VALUES
  ('viol-001', 'exp-submitted-001', 'missing_receipt', 'Receipt image quality is low', 'warning', NOW()),
  ('viol-002', 'exp-rejected-001', 'exceeds_limit', 'Amount exceeds category limit', 'error', NOW()),
  ('viol-003', 'exp-submitted-002', 'late_submission', 'Submitted 15 days after expense date', 'warning', NOW());

-- ============================================
-- 5. OCR DATA (for receipts with images)
-- ============================================

INSERT INTO te.receipt_ocr (id, user_id, storage_path, ocr_text, merchant, total, currency, date, confidence, raw_response, created_at)
VALUES
  ('ocr-001', '11111111-1111-1111-1111-111111111111', 'receipts/11111111-1111-1111-1111-111111111111/receipt-001.jpg', 'Starbucks Coffee\n123 Main St\nLatte Grande $5.50\nMuffin $3.00\nTax $1.12\nTotal $12.50', 'Starbucks', 12.50, 'USD', CURRENT_DATE - INTERVAL '1 day', 0.95, '{"confidence": 0.95, "merchant_name": "Starbucks Coffee"}', NOW()),
  ('ocr-002', '11111111-1111-1111-1111-111111111111', 'receipts/11111111-1111-1111-1111-111111111111/receipt-002.jpg', 'Restaurant ABC\nClient Dinner\nTotal $85.00', 'Restaurant ABC', 85.00, 'USD', CURRENT_DATE - INTERVAL '3 days', 0.92, '{"confidence": 0.92, "merchant_name": "Restaurant ABC"}', NOW()),
  ('ocr-003', '22222222-2222-2222-2222-222222222222', 'receipts/22222222-2222-2222-2222-222222222222/receipt-003.jpg', 'Hilton Hotels\n1 Night - Standard Room\nRoom Rate $172.90\nTax $17.09\nTotal $189.99', 'Hilton Hotel', 189.99, 'USD', CURRENT_DATE - INTERVAL '5 days', 0.98, '{"confidence": 0.98, "merchant_name": "Hilton Hotel"}', NOW());

-- ============================================
-- 6. APPROVAL WORKFLOW LOGS
-- ============================================

INSERT INTO te.expense_approvals (id, expense_id, approver_id, action, comments, created_at)
VALUES
  ('appr-001', 'exp-approved-001', 'e3333333-3333-3333-3333-333333333333', 'approved', 'Valid business expense', NOW() - INTERVAL '2 days'),
  ('appr-002', 'exp-approved-002', 'e3333333-3333-3333-3333-333333333333', 'approved', 'Conference attendance approved', NOW() - INTERVAL '3 days'),
  ('appr-003', 'exp-rejected-001', 'e3333333-3333-3333-3333-333333333333', 'rejected', 'Amount exceeds policy limit for meals ($100). Please submit individual receipts.', NOW() - INTERVAL '4 days');

-- ============================================
-- SUMMARY
-- ============================================
-- This seed creates:
-- ✅ 4 users (2 employees, 1 manager, 1 admin)
-- ✅ 7 expense categories
-- ✅ 11 expenses covering ALL states:
--    - 2 DRAFT (can be edited/submitted)
--    - 3 SUBMITTED (manager can approve/reject)
--    - 2 APPROVED (finance can reimburse)
--    - 1 REJECTED (employee can resubmit)
--    - 2 REIMBURSED (completed)
-- ✅ 3 policy violations (warnings and errors)
-- ✅ 3 OCR records (receipt data)
-- ✅ 3 approval logs (audit trail)
--
-- NO EMPTY STATES! All scenarios covered for testing:
-- - Employee can submit new expenses
-- - Manager has expenses to approve
-- - Rejection flow works
-- - Reimbursement history exists
-- - Validation rules trigger
-- ============================================
