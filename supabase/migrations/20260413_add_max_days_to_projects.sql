-- Add max_days to projects table (max contracted days per year for external projects)
-- Applied to all three TeamRadar schemas

SET search_path TO "teamradar-dev";
ALTER TABLE projects ADD COLUMN IF NOT EXISTS max_days integer;

SET search_path TO "teamradar-test";
ALTER TABLE projects ADD COLUMN IF NOT EXISTS max_days integer;

SET search_path TO "teamradar-prod";
ALTER TABLE projects ADD COLUMN IF NOT EXISTS max_days integer;

-- Reset search_path
RESET search_path;
