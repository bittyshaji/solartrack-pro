-- ============================================================
-- SEED DEFAULT STAGE TASKS
-- SolarTrack Pro - 10 Solar Installation Stages
--
-- This script populates the stage_tasks table with default tasks
-- for the 10 solar installation project stages.
-- These serve as templates that users can customize for each project.
--
-- Run this AFTER workflow_schema_migration.sql
-- ============================================================

-- ============================================================
-- STAGE 1: Site Survey & Assessment
-- Baseline tasks for understanding the site and project requirements
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 1, 'Site Inspection & Documentation', 'Professional site survey with photos and measurements', 1, 5000),
(NULL, 1, 'Solar Potential Analysis', 'Shading analysis, sunlight exposure assessment, and solar potential report', 1, 3000),
(NULL, 1, 'Electrical Infrastructure Assessment', 'Check main panel, wiring, and electrical capacity', 1, 2500),
(NULL, 1, 'Structural Assessment', 'Roof/ground condition evaluation for panel placement', 1, 3000),
(NULL, 1, 'Site Report & Recommendations', 'Comprehensive site analysis report with recommendations', 1, 2000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 2: Design & Planning
-- System design and technical planning
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 2, 'System Design & Engineering', 'Custom solar system design with load calculations', 1, 10000),
(NULL, 2, 'Structural Design & Analysis', 'Roof/ground structure design for panel support', 1, 4000),
(NULL, 2, 'Electrical Design & Layout', 'Panel, inverter, and balance of system layout', 1, 3000),
(NULL, 2, 'Permits & Approvals Planning', 'Identify required permits and regulatory requirements', 1, 2000),
(NULL, 2, '3D Layout Drawings', 'CAD drawings and 3D visualization of system', 1, 2500)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 3: Permits & Approvals
-- Regulatory compliance and permit acquisition
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 3, 'Building Permit Application', 'Application and submission of building permits', 1, 3000),
(NULL, 3, 'Electrical Permit Application', 'Electrical safety and inspection permit', 1, 2000),
(NULL, 3, 'Utility Permission & Interconnection', 'Grid interconnection approval from utility', 1, 2500),
(NULL, 3, 'Environmental/Land Approvals', 'Local environmental and zoning approvals', 1, 1500),
(NULL, 3, 'Permit Follow-up & Inspections', 'Tracking and coordination of permit approvals', 1, 2000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 4: Material Procurement
-- Sourcing and ordering system components
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 4, 'Solar Panels', 'High-efficiency solar panels (qty and kW based on design)', 50, 8000),
(NULL, 4, 'Inverter System', 'String or microinverters for power conversion', 1, 25000),
(NULL, 4, 'Balance of System Components', 'Racking, wiring, breakers, disconnects, monitoring', 1, 15000),
(NULL, 4, 'Battery Storage (Optional)', 'Battery backup system if included in design', 1, 30000),
(NULL, 4, 'Procurement & Logistics', 'Supplier coordination and delivery management', 1, 5000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 5: Structural Installation
-- Roof/ground preparation and racking installation
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 5, 'Roof Inspection & Repairs', 'Roof condition check and any necessary repairs', 1, 8000),
(NULL, 5, 'Racking System Installation', 'Install mounting system and structural support', 1, 20000),
(NULL, 5, 'Waterproofing & Sealing', 'Proper sealing to prevent water infiltration', 1, 5000),
(NULL, 5, 'Structural Load Testing', 'Verification that structure supports panel weight', 1, 3000),
(NULL, 5, 'Safety Equipment Installation', 'Railings, anchor points, and safety equipment', 1, 4000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 6: Electrical Installation
-- Wiring, connections, and electrical system setup
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 6, 'Panel Wiring & Connection', 'Connect panels in series/parallel strings with proper wiring', 1, 12000),
(NULL, 6, 'Inverter Installation', 'Install and configure inverter system', 1, 8000),
(NULL, 6, 'Breaker & Disconnect Installation', 'Safety switches, breakers, and disconnect devices', 1, 6000),
(NULL, 6, 'Electrical Panel Modification', 'Integrate solar system with main electrical panel', 1, 5000),
(NULL, 6, 'Grounding & Lightning Protection', 'Proper grounding and surge protection', 1, 4000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 7: Monitoring & Controls Setup
-- System monitoring and control infrastructure
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 7, 'Monitoring System Installation', 'Install real-time monitoring system and sensors', 1, 8000),
(NULL, 7, 'Communications Setup', 'WiFi/cellular connectivity for remote monitoring', 1, 3000),
(NULL, 7, 'Control System Configuration', 'Program system controls and setpoints', 1, 4000),
(NULL, 7, 'Mobile App Setup', 'Configure customer monitoring app/dashboard', 1, 2000),
(NULL, 7, 'Battery Management System (if applicable)', 'Install and configure BMS for battery storage', 1, 5000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 8: Testing & Commissioning
-- System testing and performance verification
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 8, 'Electrical Safety Testing', 'Insulation, continuity, and safety testing', 1, 5000),
(NULL, 8, 'Performance Testing & Optimization', 'System performance verification and tuning', 1, 6000),
(NULL, 8, 'Production Testing', 'Test actual power generation in various conditions', 1, 4000),
(NULL, 8, 'Grid Interconnection Testing', 'Verify proper utility grid integration', 1, 3000),
(NULL, 8, 'Final System Inspection', 'Comprehensive inspection before handover', 1, 3000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 9: Training & Documentation
-- Customer training and documentation handover
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 9, 'System Operation Training', 'Train customer on system operation and maintenance', 1, 4000),
(NULL, 9, 'Mobile App Training', 'Guide customer through monitoring app usage', 1, 2000),
(NULL, 9, 'Documentation Package', 'Provide system documentation, warranties, manuals', 1, 2000),
(NULL, 9, 'Maintenance Schedule Setup', 'Establish maintenance plan and schedule', 1, 2000),
(NULL, 9, 'Emergency Procedures', 'Emergency shutdown and troubleshooting guide', 1, 1500)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAGE 10: Handover & Warranty Activation
-- Final handover and warranty setup
-- ============================================================
INSERT INTO public.stage_tasks (project_id, stage_id, task_name, description, quantity, unit_cost) VALUES
(NULL, 10, 'Final Walk-Through & Sign-Off', 'Project completion walkthrough with customer', 1, 3000),
(NULL, 10, 'Warranty Registration', 'Register all equipment warranties', 1, 1500),
(NULL, 10, 'Warranty Activation & Support Setup', 'Set up warranty support channels', 1, 1500),
(NULL, 10, 'System Optimization Review', 'Final performance review and optimization', 1, 2000),
(NULL, 10, 'Post-Installation Monitoring', '30-day post-installation monitoring and support', 1, 3000)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Summary
-- ============================================================
-- Total: 50 default stage tasks across 10 stages
-- Each stage has 5 tasks that cover:
-- - Stage 1: Site Assessment (5 tasks)
-- - Stage 2: Design & Planning (5 tasks)
-- - Stage 3: Permits & Approvals (5 tasks)
-- - Stage 4: Material Procurement (5 tasks)
-- - Stage 5: Structural Installation (5 tasks)
-- - Stage 6: Electrical Installation (5 tasks)
-- - Stage 7: Monitoring & Controls (5 tasks)
-- - Stage 8: Testing & Commissioning (5 tasks)
-- - Stage 9: Training & Documentation (5 tasks)
-- - Stage 10: Handover & Warranty (5 tasks)
--
-- These are GLOBAL default tasks (project_id = NULL)
-- When creating a new project, the user can select which stages/tasks to include
-- and customize quantities and unit costs based on the specific project needs
