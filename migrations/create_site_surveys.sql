-- Create site_surveys table
CREATE TABLE IF NOT EXISTS site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  -- Survey metadata
  survey_date DATE,
  surveyor_name TEXT,

  -- Roof information
  roof_area_sqft DECIMAL(8,2),
  roof_type TEXT CHECK (roof_type IN ('flat', 'sloped', 'metal_sheet', 'concrete', 'tile', 'other')),
  roof_orientation TEXT CHECK (roof_orientation IN ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'mixed')),
  roof_pitch_degrees DECIMAL(5,2),

  -- Site conditions
  shading_percentage INTEGER CHECK (shading_percentage >= 0 AND shading_percentage <= 100),
  available_area_sqft DECIMAL(8,2),
  elevation_meters INTEGER,
  gps_latitude DECIMAL(10,7),
  gps_longitude DECIMAL(10,7),
  soil_condition TEXT,
  weather_conditions TEXT,

  -- Electrical assessment
  existing_electrical_capacity TEXT,
  grid_connection_type TEXT,

  -- Structural assessment
  structural_assessment TEXT CHECK (structural_assessment IN ('suitable', 'needs_reinforcement', 'not_suitable', 'pending')),

  -- Site access and obstacles
  access_conditions TEXT,
  nearby_obstacles TEXT,

  -- Recommendations
  recommended_capacity_kw DECIMAL(5,2),
  recommended_panel_count INTEGER,
  recommended_inverter_type TEXT,

  -- Documentation
  site_photos_urls TEXT[],
  site_sketch_url TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_surveys_project_id ON site_surveys(project_id);

-- Enable Row Level Security
ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view surveys for projects they own
CREATE POLICY site_surveys_select ON site_surveys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_surveys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only insert surveys for projects they own
CREATE POLICY site_surveys_insert ON site_surveys
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only update surveys for projects they own
CREATE POLICY site_surveys_update ON site_surveys
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_surveys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can only delete surveys for projects they own
CREATE POLICY site_surveys_delete ON site_surveys
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = site_surveys.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_surveys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_surveys_timestamp_trigger ON site_surveys;

CREATE TRIGGER update_site_surveys_timestamp_trigger
BEFORE UPDATE ON site_surveys
FOR EACH ROW
EXECUTE FUNCTION update_site_surveys_timestamp();
