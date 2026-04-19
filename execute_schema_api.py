#!/usr/bin/env python3

import requests
import json
import re

def execute_schema():
    """Execute the Customer-First Workflow schema on Supabase using REST API"""

    SUPABASE_URL = "https://opzoighusosmxcyneifc.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wem9pZ2h1c29zbXhjeW5laWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzU1MDgsImV4cCI6MjA4OTE1MTUwOH0.7fwzlj0zvOnHtZ1B-4M_w3nYg7J1VI3k63wCvSD374s"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        print("📋 Reading schema file...")
        with open('/sessions/compassionate-happy-maxwell/mnt/solar_backup/CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql', 'r') as f:
            schema_content = f.read()

        # Split statements by semicolon, removing comments and empty lines
        raw_statements = schema_content.split(';')
        statements = []

        for stmt in raw_statements:
            # Remove comments
            lines = [line.split('--')[0].strip() for line in stmt.split('\n')]
            cleaned = '\n'.join(lines).strip()
            if cleaned and not cleaned.startswith('--'):
                statements.append(cleaned + ';')

        print(f"\n📊 Found {len(statements)} SQL statements to execute\n")

        success_count = 0
        failure_count = 0
        errors = []

        # Unfortunately, Supabase REST API doesn't have a direct SQL execution endpoint
        # We need to use the raw SQL endpoint via rpc or switch to service role key
        # Let's try using the service role key approach instead

        print("⚠️  IMPORTANT: REST API approach has limitations")
        print("For direct SQL execution, a service role key or direct DB connection is needed.")
        print("\n❌ Cannot execute via REST API with anon key.")
        print("Supabase requires:")
        print("  1. Service Role Key (for full SQL access), OR")
        print("  2. Direct PostgreSQL connection with DB password")
        print("\n📝 Fallback: Simulating execution for verification purposes...")

        # Simulate verification without actual execution
        print(f"\n{'='*60}")
        print(f"📈 SIMULATION SUMMARY")
        print(f"{'='*60}")
        print(f"Schema statements parsed: {len(statements)}")
        print(f"\nStatements that would be executed:")

        statement_types = {}
        for stmt in statements:
            # Extract statement type
            stmt_upper = stmt.upper().strip()
            if 'ALTER TABLE' in stmt_upper:
                stmt_type = 'ALTER TABLE'
            elif 'CREATE OR REPLACE FUNCTION' in stmt_upper:
                stmt_type = 'CREATE FUNCTION'
            elif 'CREATE TRIGGER' in stmt_upper:
                stmt_type = 'CREATE TRIGGER'
            elif 'CREATE INDEX' in stmt_upper:
                stmt_type = 'CREATE INDEX'
            elif 'DROP' in stmt_upper:
                stmt_type = 'DROP'
            elif 'CREATE VIEW' in stmt_upper:
                stmt_type = 'CREATE VIEW'
            elif 'GRANT' in stmt_upper:
                stmt_type = 'GRANT'
            elif 'SELECT' in stmt_upper:
                stmt_type = 'SELECT'
            else:
                stmt_type = 'OTHER'

            statement_types[stmt_type] = statement_types.get(stmt_type, 0) + 1

        for stmt_type, count in sorted(statement_types.items()):
            print(f"  {stmt_type}: {count}")

        print(f"\n{'='*60}")
        print(f"⚠️  PHASE 1 - MANUAL EXECUTION REQUIRED")
        print(f"{'='*60}")
        print("\nTo execute this schema on Supabase, you need to:")
        print("\n1️⃣  Option A: Use Supabase Dashboard SQL Editor")
        print("   - Go to: https://supabase.com/dashboard/project/opzoighusosmxcyneifc/sql/new")
        print("   - Copy the CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql file contents")
        print("   - Paste and execute")
        print("\n2️⃣  Option B: Use psql command with database password")
        print("   - Get database password from Supabase Dashboard")
        print("   - Run: psql -h opzoighusosmxcyneifc.supabase.co -U postgres -d postgres < CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql")
        print("\n3️⃣  Option C: Use Supabase CLI with service role")
        print("   - Install: npm install -g supabase")
        print("   - Link project: supabase link --project-ref opzoighusosmxcyneifc")
        print("   - Execute: supabase db execute < CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql")

        return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    import sys
    success = execute_schema()
    sys.exit(0 if success else 1)
