-- Reset all stage_tasks quantities to 0
-- Run this in your Supabase SQL Editor to fix the default quantities

UPDATE stage_tasks
SET quantity = 0
WHERE quantity IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as total_tasks, 
       SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as tasks_with_zero_qty
FROM stage_tasks;
