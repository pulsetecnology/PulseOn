
-- Add lifestyle fields to users table
ALTER TABLE users ADD COLUMN smoking_status TEXT;
ALTER TABLE users ADD COLUMN alcohol_consumption TEXT;
ALTER TABLE users ADD COLUMN diet_type TEXT;
ALTER TABLE users ADD COLUMN sleep_hours TEXT;
ALTER TABLE users ADD COLUMN stress_level TEXT;
ALTER TABLE users ADD COLUMN preferred_workout_time TEXT;
ALTER TABLE users ADD COLUMN available_days_per_week INTEGER;
ALTER TABLE users ADD COLUMN average_workout_duration TEXT;
ALTER TABLE users ADD COLUMN preferred_location TEXT;
