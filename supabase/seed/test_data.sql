-- =============================================
-- TEST SEED DATA
-- Run AFTER creating test users via Supabase Auth dashboard
-- Replace UUIDs with actual user IDs from auth.users
-- =============================================

-- Example: Update profile display names for test users
-- UPDATE profiles SET display_name = '테스트 유저1', bio = '일상을 기록하는 사람' WHERE username = 'testuser1';
-- UPDATE profiles SET display_name = '테스트 유저2', bio = '생각을 나누는 사람' WHERE username = 'testuser2';

-- Example: Enable question categories for a test user
-- INSERT INTO user_question_settings (user_id, category_id, is_enabled, notify_time)
-- VALUES
--   ('USER_UUID_HERE', '00000000-0000-0000-0000-000000000001', TRUE, '09:00:00'),
--   ('USER_UUID_HERE', '00000000-0000-0000-0000-000000000002', TRUE, NULL),
--   ('USER_UUID_HERE', '00000000-0000-0000-0000-000000000006', TRUE, '21:00:00');

-- Verify question categories were seeded
SELECT id, name, icon, sort_order FROM question_categories ORDER BY sort_order;

-- Verify questions were seeded
SELECT q.body, c.name as category FROM questions q
JOIN question_categories c ON c.id = q.category_id
ORDER BY c.sort_order, q.sort_order;
