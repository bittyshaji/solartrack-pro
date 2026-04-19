#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://opzoighusosmxcyneifc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wem9pZ2h1c29zbXhjeW5laWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzU1MDgsImV4cCI6MjA4OTE1MTUwOH0.7fwzlj0zvOnHtZ1B-4M_w3nYg7J1VI3k63wCvSD374s';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeSchema() {
  try {
    console.log('📋 Reading schema file...');
    const schemaFile = fs.readFileSync(
      path.join(__dirname, 'CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql'),
      'utf8'
    );

    // Split the SQL into individual statements, filtering out comments and empty lines
    const statements = schemaFile
      .split(/;\s*(?:--.*)?$/m)
      .filter(stmt => {
        const cleaned = stmt.trim().replace(/^--.*$/gm, '').trim();
        return cleaned.length > 0;
      })
      .map(stmt => stmt.trim() + ';');

    console.log(`\n📊 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip verification/informational queries
      if (statement.includes('SELECT') && statement.includes('information_schema')) {
        console.log(`⏭️  [${i + 1}/${statements.length}] Skipping verification query`);
        continue;
      }

      try {
        console.log(`\n⚙️  [${i + 1}/${statements.length}] Executing...`);
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          console.error(`❌ Error: ${error.message}`);
          errors.push({ stmt: statement.substring(0, 100), error: error.message });
          failureCount++;
        } else {
          console.log(`✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        errors.push({ stmt: statement.substring(0, 100), error: err.message });
        failureCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📈 EXECUTION SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      errors.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.error}`);
        console.log(`     Statement: ${e.stmt}...`);
      });
    }

    // Run verification queries
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 RUNNING VERIFICATION QUERIES`);
    console.log(`${'='.repeat(60)}\n`);

    // Check NOT NULL constraint
    console.log('1. Checking NOT NULL constraint on projects.customer_id...');
    const { data: notNullCheck } = await supabase.rpc('exec_sql', {
      sql: `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'customer_id';`
    });
    console.log(`   Result: ${notNullCheck ? JSON.stringify(notNullCheck) : 'Could not verify'}\n`);

    // Check triggers
    console.log('2. Checking triggers...');
    const { data: triggersCheck } = await supabase.rpc('exec_sql', {
      sql: `SELECT trigger_name FROM information_schema.triggers WHERE event_object_table IN ('projects', 'project_customers') ORDER BY trigger_name;`
    });
    console.log(`   Found triggers: ${triggersCheck ? triggersCheck.length : 0}\n`);

    // Check indexes
    console.log('3. Checking indexes...');
    const { data: indexesCheck } = await supabase.rpc('exec_sql', {
      sql: `SELECT indexname FROM pg_indexes WHERE tablename IN ('projects', 'project_customers') ORDER BY indexname;`
    });
    console.log(`   Found indexes: ${indexesCheck ? indexesCheck.length : 0}\n`);

    // Check views
    console.log('4. Checking views...');
    const { data: viewsCheck } = await supabase.rpc('exec_sql', {
      sql: `SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name IN ('customer_project_summary', 'projects_with_customers');`
    });
    console.log(`   Found views: ${viewsCheck ? viewsCheck.length : 0}\n`);

    console.log(`${'='.repeat(60)}`);
    console.log(`✅ PHASE 1 EXECUTION COMPLETE`);
    console.log(`${'='.repeat(60)}`);

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    process.exit(1);
  }
}

executeSchema();
