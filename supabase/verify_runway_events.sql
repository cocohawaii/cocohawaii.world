-- Run this in Supabase SQL Editor to verify runway_events exists
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'runway_events';

-- If the above returns a row, the table exists. Then try:
NOTIFY pgrst, 'reload schema';
