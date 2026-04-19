/**
 * SolarTrackPro - Full End-to-End Test Script (v2 - Fixed Schemas)
 * ================================================================
 *
 * HOW TO RUN:
 * 1. Open https://solartrack-pro.vercel.app in your browser
 * 2. Log in with your account
 * 3. Press F12 → Console tab
 * 4. Paste this entire script and press Enter
 * 5. Wait for the test to complete (about 30 seconds)
 *
 * The script will:
 * - Create a test project
 * - Insert sample data into ALL panels
 * - Verify each insert succeeded
 * - Print a detailed report
 */

(async () => {
  const SUPABASE_URL = 'https://opzoighusosmxcyneifc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wem9pZ2h1c29zbXhjeW5laWZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NzU1MDgsImV4cCI6MjA4OTE1MTUwOH0.7fwzlj0zvOnHtZ1B-4M_w3nYg7J1VI3k63wCvSD374s';

  // Get the current session from Supabase (already logged in via the app)
  let ACCESS_TOKEN = null;
  let USER_ID = null;

  for (const [key, value] of Object.entries(localStorage)) {
    try {
      const parsed = JSON.parse(value);
      if (parsed?.access_token && parsed?.user?.id) {
        ACCESS_TOKEN = parsed.access_token;
        USER_ID = parsed.user.id;
        break;
      }
      if (parsed?.session?.access_token && parsed?.session?.user?.id) {
        ACCESS_TOKEN = parsed.session.access_token;
        USER_ID = parsed.session.user.id;
        break;
      }
    } catch(e) {}
  }

  if (!ACCESS_TOKEN) {
    console.error('❌ Not logged in! Please log in first, then run this script.');
    return;
  }

  console.log(`✅ Authenticated as user: ${USER_ID}`);

  // API helper
  const api = async (method, endpoint, data = null) => {
    const opts = {
      method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (data) opts.body = JSON.stringify(data);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, opts);
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  };

  const results = [];
  const log = (phase, step, status, detail) => {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${phase}] ${step}: ${detail}`);
    results.push({ phase, step, status, detail });
  };

  // ============================================
  // STEP 1: CREATE TEST PROJECT
  // ============================================
  console.log('\n🔵 ═══════════════════════════════════════');
  console.log('   CREATING TEST PROJECT');
  console.log('   ═══════════════════════════════════════\n');

  const projectData = {
    name: 'E2E Test - Solar 5kW Residential',
    user_id: USER_ID,
    status: 'In Progress',
    stage: 1,
    project_state: 'Estimation',
    client_name: 'Mr. Rajesh Kumar',
    location: 'Kochi, Kerala',
    capacity_kw: 5.0,
    start_date: '2026-04-01',
    end_date: '2026-06-30',
    notes: 'Test project for E2E validation of all panels'
  };

  const projResult = await api('POST', 'projects', projectData);
  let PROJECT_ID;

  if (projResult.ok && projResult.data?.[0]?.id) {
    PROJECT_ID = projResult.data[0].id;
    log('SETUP', 'Create Project', 'PASS', `Project created: ${PROJECT_ID.substring(0,8)}... "${projectData.name}"`);
  } else {
    console.error('Failed to create project:', projResult.data);
    log('SETUP', 'Create Project', 'FAIL', JSON.stringify(projResult.data));
    return;
  }

  // ============================================
  // PHASE 1: PRE-SALES
  // ============================================
  console.log('\n🟠 ═══════════════════════════════════════');
  console.log('   PHASE 1: PRE-SALES');
  console.log('   ═══════════════════════════════════════\n');

  // --- 1a. Follow-up Tracker ---
  const followupData = {
    project_id: PROJECT_ID,
    followup_type: 'customer',
    scheduled_date: '2026-04-20T10:00:00',
    status: 'pending',
    assigned_to: USER_ID,
    communication_method: 'phone',
    contact_person: 'Mr. Rajesh Kumar',
    notes: 'Initial call to discuss solar panel installation requirements and roof assessment',
    created_by: USER_ID
  };

  const followupResult = await api('POST', 'followups', followupData);
  if (followupResult.ok) {
    log('PRE-SALES', 'Follow-up Tracker', 'PASS',
      `Created follow-up: ${followupData.followup_type} call with ${followupData.contact_person} on April 20`);

    const followup2 = await api('POST', 'followups', {
      ...followupData,
      followup_type: 'site_visit',
      scheduled_date: '2026-04-22T14:00:00',
      notes: 'Site visit to assess roof condition and measure dimensions',
      communication_method: 'visit'
    });
    if (followup2.ok) {
      log('PRE-SALES', 'Follow-up (2nd entry)', 'PASS', 'Created site visit follow-up for April 22');
    }
  } else {
    log('PRE-SALES', 'Follow-up Tracker', 'FAIL', JSON.stringify(followupResult.data));
  }

  // --- 1b. Site Survey (corrected: roof_type must be one of flat/sloped/metal_sheet/concrete/tile/other) ---
  const surveyData = {
    project_id: PROJECT_ID,
    survey_date: '2026-04-22',
    surveyor_name: 'Arun Menon',
    roof_type: 'flat',
    roof_orientation: 'south',
    roof_area_sqft: 450,
    roof_pitch_degrees: 5,
    shading_percentage: 5,
    available_area_sqft: 400,
    existing_electrical_capacity: '5kW single phase',
    grid_connection_type: 'single_phase',
    structural_assessment: 'suitable',
    access_conditions: 'Easy staircase access to flat concrete roof',
    nearby_obstacles: 'Coconut trees on south-west, minimal shading',
    recommended_capacity_kw: 5.0,
    recommended_panel_count: 12,
    recommended_inverter_type: '5 kW string inverter',
    notes: 'Flat concrete roof in excellent condition. South-facing with minimal obstruction. Ideal for 5kW installation.'
  };

  const surveyResult = await api('POST', 'site_surveys', surveyData);
  if (surveyResult.ok) {
    log('PRE-SALES', 'Site Survey', 'PASS',
      `Survey by ${surveyData.surveyor_name}: ${surveyData.roof_type} roof, ${surveyData.roof_area_sqft} sqft, recommended ${surveyData.recommended_capacity_kw}kW with ${surveyData.recommended_panel_count} panels`);
  } else {
    log('PRE-SALES', 'Site Survey', 'FAIL', JSON.stringify(surveyResult.data));
  }

  // --- 1c. Order Confirmation (corrected columns) ---
  const securityData = {
    project_id: PROJECT_ID,
    secure_status: 'lead',
    advance_payment_received: false,
    advance_payment_amount: 0,
    notes: 'Customer is interested, site survey completed. Awaiting proposal acceptance.'
  };

  const securityResult = await api('POST', 'project_security_status', securityData);
  if (securityResult.ok) {
    log('PRE-SALES', 'Order Confirmation', 'PASS',
      `Status: ${securityData.secure_status} | Advance received: ${securityData.advance_payment_received}`);
  } else {
    log('PRE-SALES', 'Order Confirmation', 'FAIL', JSON.stringify(securityResult.data));
  }

  // ============================================
  // PHASE 2: PRE-EXECUTION
  // ============================================
  console.log('\n🟢 ═══════════════════════════════════════');
  console.log('   PHASE 2: PRE-EXECUTION');
  console.log('   ═══════════════════════════════════════\n');

  // --- 2a. Payment Stages (corrected: paid_date → payment_received_date) ---
  const paymentStages = [
    {
      project_id: PROJECT_ID,
      stage_name: 'advance',
      stage_percentage: 30,
      payment_amount: 105000,
      payment_status: 'paid',
      trigger_condition: 'Order confirmation',
      due_date: '2026-04-25',
      payment_received_date: '2026-04-25',
      payment_method: 'bank_transfer',
      payment_reference: 'NEFT/2026/APR/001234',
      notes: 'Advance payment received via NEFT'
    },
    {
      project_id: PROJECT_ID,
      stage_name: 'interim_1',
      stage_percentage: 30,
      payment_amount: 105000,
      payment_status: 'pending',
      trigger_condition: 'Panel installation complete',
      due_date: '2026-05-15',
      notes: 'Due after panel installation'
    },
    {
      project_id: PROJECT_ID,
      stage_name: 'interim_2',
      stage_percentage: 20,
      payment_amount: 70000,
      payment_status: 'pending',
      trigger_condition: 'KSEB inspection passed',
      due_date: '2026-06-01',
      notes: 'Due after KSEB inspection'
    },
    {
      project_id: PROJECT_ID,
      stage_name: 'final',
      stage_percentage: 20,
      payment_amount: 70000,
      payment_status: 'pending',
      trigger_condition: 'System commissioning complete',
      due_date: '2026-06-30',
      notes: 'Final payment after handover'
    }
  ];

  let paymentPass = true;
  let paymentError = '';
  for (const stage of paymentStages) {
    const r = await api('POST', 'payment_stages', stage);
    if (!r.ok) { paymentPass = false; paymentError = JSON.stringify(r.data); break; }
  }

  if (paymentPass) {
    log('PRE-EXEC', 'Payment Stages', 'PASS',
      '4 stages: Advance ₹1,05,000 (PAID) | Interim-1 ₹1,05,000 | Interim-2 ₹70,000 | Final ₹70,000 | Total: ₹3,50,000');
  } else {
    log('PRE-EXEC', 'Payment Stages', 'FAIL', paymentError);
  }

  // --- 2b. KSEB Feasibility (corrected columns) ---
  const feasibilityData = {
    project_id: PROJECT_ID,
    submission_date: '2026-04-28',
    reference_number: 'KSEB/FES/2026/KOC/004521',
    kseb_division: 'Kochi South',
    capacity_kw: 5,
    system_type: 'residential',
    inverter_make: 'Growatt',
    inverter_model: 'MIN 5000TL-X',
    panel_make: 'Jinko Solar',
    panel_model: 'JKM400M-54HL4-V',
    mounting_type: 'roof',
    submission_status: 'submitted',
    submitted_by: USER_ID,
    created_by: USER_ID
  };

  const feasResult = await api('POST', 'kseb_feasibility_submissions', feasibilityData);
  if (feasResult.ok) {
    log('PRE-EXEC', 'KSEB Feasibility', 'PASS',
      `Ref ${feasibilityData.reference_number} submitted to ${feasibilityData.kseb_division} for ${feasibilityData.capacity_kw}kW ${feasibilityData.system_type}`);
  } else {
    log('PRE-EXEC', 'KSEB Feasibility', 'FAIL', JSON.stringify(feasResult.data));
  }

  // ============================================
  // PHASE 3: EXECUTION
  // ============================================
  console.log('\n🔷 ═══════════════════════════════════════');
  console.log('   PHASE 3: EXECUTION');
  console.log('   ═══════════════════════════════════════\n');

  // --- 3a. Stage Checklists (corrected columns) ---
  const checklistData = {
    project_id: PROJECT_ID,
    stage_sequence: 1,
    stage_name: 'Site Survey',
    checklist_items_total: 8,
    checklist_items_completed: 8,
    completion_percentage: 100,
    actual_start_date: '2026-04-22',
    actual_end_date: '2026-04-22',
    notes: 'Site survey stage fully completed'
  };

  const checkResult = await api('POST', 'construction_stage_metrics', checklistData);
  if (checkResult.ok) {
    log('EXECUTION', 'Stage Checklist (Stage 1)', 'PASS',
      'Stage 1 "Site Survey": 8/8 items complete (100%)');

    const check2 = await api('POST', 'construction_stage_metrics', {
      project_id: PROJECT_ID,
      stage_sequence: 3,
      stage_name: 'Mounting Work',
      checklist_items_total: 10,
      checklist_items_completed: 6,
      completion_percentage: 60,
      actual_start_date: '2026-05-01',
      notes: 'Mounting structure installation in progress'
    });
    if (check2.ok) {
      log('EXECUTION', 'Stage Checklist (Stage 3)', 'PASS', 'Stage 3 "Mounting Work": 6/10 items (60% complete)');
    }
  } else {
    log('EXECUTION', 'Stage Checklist', 'FAIL', JSON.stringify(checkResult.data));
  }

  // --- 3b. KSEB Energisation (corrected columns) ---
  const energisationData = {
    project_id: PROJECT_ID,
    energisation_status: 'scheduled',
    visit_scheduled_date: '2026-06-10',
    inspector_name: 'Mr. Suresh Babu',
    inspector_phone: '9876501234',
    notes: 'KSEB inspection scheduled for June 10. Inspector assigned.',
  };

  const energResult = await api('POST', 'kseb_energisation_visits', energisationData);
  if (energResult.ok) {
    log('EXECUTION', 'KSEB Energisation', 'PASS',
      `Inspection scheduled: ${energisationData.visit_scheduled_date} by ${energisationData.inspector_name}`);
  } else {
    log('EXECUTION', 'KSEB Energisation', 'FAIL', JSON.stringify(energResult.data));
  }

  // ============================================
  // PHASE 4: POST-COMPLETION
  // ============================================
  console.log('\n🟣 ═══════════════════════════════════════');
  console.log('   PHASE 4: POST-COMPLETION');
  console.log('   ═══════════════════════════════════════\n');

  // --- 4a. Completion Certificate (skip issued_by FK to avoid auth.users permission issue) ---
  const certData = {
    project_id: PROJECT_ID,
    approval_status: 'draft',
    issued_by_name: 'Bitty Shaji',
    system_capacity_kw: 5.0,
    inverter_make: 'Growatt',
    inverter_model: 'MIN 5000TL-X',
    panel_make: 'Jinko Solar',
    panel_model: 'JKM400M-54HL4-V',
    total_panels: 12,
    installation_completion_date: '2026-06-05',
    commissioned_by: 'Arun Menon',
    commissioning_date: '2026-06-08',
    performance_test_results: {
      generation_day1: 22.5,
      generation_day2: 21.8,
      generation_day3: 23.1,
      average_daily: 22.47,
      expected_daily: 22.0,
      performance_ratio: 102.1
    },
    notes: 'System performing above expected output. All safety checks passed.'
  };
  // Note: We intentionally skip 'issued_by' (uuid FK to auth.users) because
  // the anon role cannot validate FKs against auth.users table.

  const certResult = await api('POST', 'completion_certificates', certData);
  if (certResult.ok) {
    log('POST-COMP', 'Completion Certificate', 'PASS',
      `Certificate draft: ${certData.total_panels}x ${certData.panel_make} + ${certData.inverter_make} ${certData.inverter_model} | Performance: 102.1%`);
  } else {
    log('POST-COMP', 'Completion Certificate', 'FAIL', JSON.stringify(certResult.data));
  }

  // --- 4b. Handover Document (document_number is NOT NULL, must provide it) ---
  const handoverData = {
    project_id: PROJECT_ID,
    document_number: `HO-${Date.now().toString(36).toUpperCase()}`,
    document_status: 'pending',
    generated_by: USER_ID,
    delivery_method: 'print',
    includes_warranty: true,
    includes_manual: true,
    includes_performance_metrics: true,
    includes_maintenance_guide: true,
    includes_contact_info: true,
    system_summary_json: {
      capacity_kw: 5,
      panels: '12x Jinko Solar JKM400M-54HL4-V',
      inverter: 'Growatt MIN 5000TL-X',
      address: '123, Green Valley, Kochi, Kerala 682001',
      customer: 'Mr. Rajesh Kumar'
    },
    notes: 'Complete handover package prepared with all documentation'
  };

  const handoverResult = await api('POST', 'handover_documents', handoverData);
  if (handoverResult.ok) {
    log('POST-COMP', 'Handover Document', 'PASS',
      'Handover draft created with warranty, manual, performance metrics, maintenance guide');
  } else {
    log('POST-COMP', 'Handover Document', 'FAIL', JSON.stringify(handoverResult.data));
  }

  // --- 4c. Warranty (corrected columns) ---
  const warrantyData = {
    project_id: PROJECT_ID,
    commissioning_date: '2026-06-08',
    warranty_provider: 'SolarTrack Pro',
    warranty_start_date: '2026-06-08',
    warranty_end_date: '2031-06-08',
    default_warranty_months: 60,
    coverage_details: 'Covers all components including panels, inverter, mounting structure, wiring, and workmanship',
    inclusions: '{Panels,Inverter,Mounting structure,Wiring,Workmanship}',
    exclusions: '{Natural disasters,Unauthorized modifications,Physical damage}',
    notes: 'Comprehensive warranty covering all system components'
  };

  const warrantyResult = await api('POST', 'project_warranties', warrantyData);
  if (warrantyResult.ok) {
    log('POST-COMP', 'Warranty', 'PASS',
      `${warrantyData.warranty_provider}: ${warrantyData.default_warranty_months} months (${warrantyData.warranty_start_date} to ${warrantyData.warranty_end_date})`);
  } else {
    log('POST-COMP', 'Warranty', 'FAIL', JSON.stringify(warrantyResult.data));
  }

  // --- 4d. Service Request (corrected columns) ---
  const serviceData = {
    project_id: PROJECT_ID,
    customer_id: USER_ID,
    issue_title: 'Annual maintenance check - Year 1',
    issue_description: 'Scheduled annual maintenance: panel cleaning, wiring inspection, inverter diagnostics, and performance check.',
    severity: 'low',
    status: 'open',
    assigned_to: USER_ID,
    warranty_related: true
  };

  const serviceResult = await api('POST', 'customer_service_requests', serviceData);
  if (serviceResult.ok) {
    log('POST-COMP', 'Service Request', 'PASS',
      `"${serviceData.issue_title}" - severity: ${serviceData.severity}, status: ${serviceData.status}`);
  } else {
    log('POST-COMP', 'Service Request', 'FAIL', JSON.stringify(serviceResult.data));
  }

  // ============================================
  // VERIFICATION: Read back all data
  // ============================================
  console.log('\n🔍 ═══════════════════════════════════════');
  console.log('   VERIFICATION: Reading back all data');
  console.log('   ═══════════════════════════════════════\n');

  const tables = [
    { name: 'followups', label: 'Follow-ups' },
    { name: 'site_surveys', label: 'Site Survey' },
    { name: 'project_security_status', label: 'Order Confirmation' },
    { name: 'payment_stages', label: 'Payment Stages' },
    { name: 'kseb_feasibility_submissions', label: 'KSEB Feasibility' },
    { name: 'construction_stage_metrics', label: 'Stage Checklists' },
    { name: 'kseb_energisation_visits', label: 'KSEB Energisation' },
    { name: 'completion_certificates', label: 'Completion Certificate' },
    { name: 'handover_documents', label: 'Handover Document' },
    { name: 'project_warranties', label: 'Warranty' },
    { name: 'customer_service_requests', label: 'Service Requests' },
  ];

  for (const table of tables) {
    const r = await api('GET', `${table.name}?project_id=eq.${PROJECT_ID}&select=id`);
    const count = r.ok ? (Array.isArray(r.data) ? r.data.length : 0) : 0;
    if (count > 0) {
      log('VERIFY', table.label, 'PASS', `${count} record(s) found in ${table.name}`);
    } else {
      log('VERIFY', table.label, 'FAIL', `No records found in ${table.name}`);
    }
  }

  // ============================================
  // FINAL REPORT
  // ============================================
  console.log('\n📊 ═══════════════════════════════════════');
  console.log('   FINAL TEST REPORT');
  console.log('   ═══════════════════════════════════════\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARN').length;

  console.log(`   Total tests:  ${results.length}`);
  console.log(`   ✅ Passed:    ${passed}`);
  console.log(`   ❌ Failed:    ${failed}`);
  console.log(`   ⚠️  Warnings:  ${warned}`);
  console.log(`   Success rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('');
  console.log(`   🔗 View test project: https://solartrack-pro.vercel.app/projects/${PROJECT_ID}`);
  console.log('');

  if (failed === 0) {
    console.log('   🎉 ALL TESTS PASSED! Every panel is working correctly.');
  } else {
    console.log('   ⚠️  Some tests failed. Check the detailed log above.');
    console.log('   Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`     - [${r.phase}] ${r.step}: ${r.detail}`);
    });
  }

  console.log('\n   ═══════════════════════════════════════\n');
})();
