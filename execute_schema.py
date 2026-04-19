#!/usr/bin/env python3

import psycopg2
import os
import sys
from urllib.parse import urlparse

def execute_schema():
    """Execute the Customer-First Workflow schema on Supabase"""

    # Supabase connection details
    supabase_url = "https://opzoighusosmxcyneifc.supabase.co"
    # Extract host from URL
    host = "opzoighusosmxcyneifc.supabase.co"

    # For Supabase, we need to use postgres connection details
    # Default Supabase postgres port
    port = 5432
    database = "postgres"
    user = "postgres"

    # Note: We need the actual database password for direct postgres connection
    # This should be provided via environment variable or secure method
    password = os.getenv("SUPABASE_DB_PASSWORD")

    if not password:
        print("❌ ERROR: SUPABASE_DB_PASSWORD environment variable not set")
        print("Please set the Supabase database password and try again")
        return False

    try:
        print("📋 Reading schema file...")
        with open('/sessions/compassionate-happy-maxwell/mnt/solar_backup/CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql', 'r') as f:
            schema_content = f.read()

        print("🔌 Connecting to Supabase database...")
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password,
            sslmode="require"
        )

        cursor = conn.cursor()

        # Split statements by semicolon
        statements = [s.strip() for s in schema_content.split(';') if s.strip()]

        print(f"\n📊 Found {len(statements)} SQL statements to execute\n")

        success_count = 0
        failure_count = 0
        errors = []

        for i, statement in enumerate(statements, 1):
            # Skip empty lines and comments
            if not statement or statement.startswith('--'):
                continue

            try:
                print(f"⚙️  [{i}/{len(statements)}] Executing statement...")
                cursor.execute(statement)
                conn.commit()
                print(f"✅ Success")
                success_count += 1
            except psycopg2.Error as e:
                print(f"❌ Error: {e.pgerror if hasattr(e, 'pgerror') else str(e)}")
                errors.append({
                    'statement': statement[:100],
                    'error': str(e)
                })
                failure_count += 1
                # Continue with next statement
                conn.rollback()

        print(f"\n{'='*60}")
        print(f"📈 EXECUTION SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Successful: {success_count}")
        print(f"❌ Failed: {failure_count}")

        if errors:
            print(f"\n⚠️  Errors encountered:")
            for idx, e in enumerate(errors, 1):
                print(f"  {idx}. {e['error']}")
                print(f"     Statement: {e['statement']}...")

        # Run verification queries
        print(f"\n{'='*60}")
        print(f"🔍 RUNNING VERIFICATION QUERIES")
        print(f"{'='*60}\n")

        # Check NOT NULL constraint
        print("1. Checking NOT NULL constraint on projects.customer_id...")
        cursor.execute("""
            SELECT is_nullable FROM information_schema.columns
            WHERE table_name = 'projects' AND column_name = 'customer_id'
        """)
        result = cursor.fetchone()
        if result:
            is_nullable = result[0]
            print(f"   is_nullable: {is_nullable} {'✅ (GOOD - NOT NULL applied)' if is_nullable == 'NO' else '❌ (NOT NULL not applied)'}\n")
        else:
            print(f"   ❌ Column not found\n")

        # Check triggers
        print("2. Checking triggers...")
        cursor.execute("""
            SELECT trigger_name FROM information_schema.triggers
            WHERE event_object_table IN ('projects', 'project_customers')
            ORDER BY trigger_name
        """)
        triggers = cursor.fetchall()
        print(f"   Found {len(triggers)} triggers:")
        for trigger in triggers:
            print(f"     - {trigger[0]}")
        expected_triggers = ['projects_customer_validation', 'prevent_customer_deletion']
        found_triggers = [t[0] for t in triggers]
        if all(t in found_triggers for t in expected_triggers):
            print(f"   ✅ All expected triggers found\n")
        else:
            print(f"   ⚠️  Missing triggers: {set(expected_triggers) - set(found_triggers)}\n")

        # Check indexes
        print("3. Checking indexes...")
        cursor.execute("""
            SELECT indexname FROM pg_indexes
            WHERE tablename IN ('projects', 'project_customers')
            ORDER BY indexname
        """)
        indexes = cursor.fetchall()
        print(f"   Found {len(indexes)} indexes:")
        for idx in indexes:
            print(f"     - {idx[0]}")
        expected_indexes = [
            'idx_projects_customer_id',
            'idx_projects_customer_status',
            'idx_project_customers_is_active',
            'idx_project_customers_active_name'
        ]
        found_indexes = [i[0] for i in indexes]
        missing = [i for i in expected_indexes if i not in found_indexes]
        if not missing:
            print(f"   ✅ All expected indexes found\n")
        else:
            print(f"   ⚠️  Missing indexes: {missing}\n")

        # Check views
        print("4. Checking views...")
        cursor.execute("""
            SELECT table_name FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name IN ('customer_project_summary', 'projects_with_customers')
            ORDER BY table_name
        """)
        views = cursor.fetchall()
        print(f"   Found {len(views)} views:")
        for view in views:
            print(f"     - {view[0]}")
        expected_views = ['customer_project_summary', 'projects_with_customers']
        found_views = [v[0] for v in views]
        if all(v in found_views for v in expected_views):
            print(f"   ✅ All expected views found\n")
        else:
            print(f"   ⚠️  Missing views: {set(expected_views) - set(found_views)}\n")

        cursor.close()
        conn.close()

        print(f"{'='*60}")
        print(f"✅ PHASE 1 EXECUTION COMPLETE")
        print(f"{'='*60}")

        return failure_count == 0

    except psycopg2.OperationalError as e:
        print(f"❌ Connection error: {e}")
        print("\nNote: Direct PostgreSQL connection requires database password.")
        print("This can be obtained from Supabase dashboard under Project Settings > Database")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = execute_schema()
    sys.exit(0 if success else 1)
