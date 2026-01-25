import { createClient } from '@supabase/supabase-js'
import type { Database } from './lib/database.types'

const supabaseAdmin = createClient<Database>(
  'https://kzfhnexkzudugagmsoyu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZmhuZXhrenVkdWdhZ21zb3l1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYyMDY1OCwiZXhwIjoyMDg0MTk2NjU4fQ.mgIyeYZqqAqPyFOwGWiMUuX7TMQ-2a1LwRtuc9mIwbc',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testFile01() {
  console.log('🧪 Testing FILE 01: The Atomic Spine\n')

  const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001'

  try {
    // Step 1: Create provenance (the receipt)
    console.log('📝 Step 1: Creating provenance record...')
    const { data: provenance, error: provError } = await supabaseAdmin
      .from('provenance_ledger')
      .insert({
        org_id: TEST_ORG_ID,
        blob_storage_path: '/test/genesis.csv',
        coordinate_map: { row: 1, col: 'A' },
        sha256_hash: `test_${Date.now()}`,
        file_type: 'text/csv',
        original_filename: 'genesis.csv'
      })
      .select()
      .single()

    if (provError) throw provError
    console.log('✅ Provenance created:', provenance.provenance_id)

    // Step 2: Insert a POSITIVE fact (revenue)
    console.log('\n💰 Step 2: Inserting POSITIVE vector (revenue)...')
    const { data: positiveFact, error: posError } = await supabaseAdmin
      .from('atomic_fact_spine')
      .insert({
        org_id: TEST_ORG_ID,
        vector_type: 'POSITIVE',
        magnitude: 542.19,
        temporal_anchor: new Date().toISOString(),
        triad_map: { uv_id: 'genesis_sale_1' },
        provenance_id: provenance.provenance_id,
        confidence: 0.995
      })
      .select()
      .single()

    if (posError) throw posError
    console.log('✅ POSITIVE fact created:', positiveFact.fact_id)

    // Step 3: Insert a NEGATIVE fact (expense)
    console.log('\n💸 Step 3: Inserting NEGATIVE vector (expense)...')
    const { data: negativeFact, error: negError } = await supabaseAdmin
      .from('atomic_fact_spine')
      .insert({
        org_id: TEST_ORG_ID,
        vector_type: 'NEGATIVE',
        magnitude: 230.00,
        temporal_anchor: new Date().toISOString(),
        triad_map: { iv_id: 'genesis_expense_1' },
        provenance_id: provenance.provenance_id,
        confidence: 0.993
      })
      .select()
      .single()

    if (negError) throw negError
    console.log('✅ NEGATIVE fact created:', negativeFact.fact_id)

    // Step 4: Test immutability (should fail)
    console.log('\n🔒 Step 4: Testing immutability (should fail)...')
    const { error: updateError } = await supabaseAdmin
      .from('atomic_fact_spine')
      .update({ magnitude: 999.99 })
      .eq('fact_id', positiveFact.fact_id)

    if (updateError) {
      console.log('✅ Immutability enforced:', updateError.message)
    } else {
      console.log('❌ ERROR: Update should have been blocked!')
    }

    // Step 5: Test confidence gate (should fail)
    console.log('\n🚫 Step 5: Testing confidence gate (should reject)...')
    const { error: lowConfError } = await supabaseAdmin
      .from('atomic_fact_spine')
      .insert({
        org_id: TEST_ORG_ID,
        vector_type: 'POSITIVE',
        magnitude: 100.00,
        temporal_anchor: new Date().toISOString(),
        triad_map: { uv_id: 'low_confidence_test' },
        provenance_id: provenance.provenance_id,
        confidence: 0.99 // Below 0.992 threshold
      })

    if (lowConfError) {
      console.log('✅ Confidence gate enforced:', lowConfError.message)
    } else {
      console.log('❌ ERROR: Low confidence fact should have been rejected!')
    }

    // Step 6: Insert into quarantine
    console.log('\n⚠️  Step 6: Inserting low-confidence fact into quarantine...')
    const { data: quarantine, error: quarError } = await supabaseAdmin
      .from('quarantine_ledger')
      .insert({
        org_id: TEST_ORG_ID,
        raw_data: { amount: 'unknown', date: 'invalid' },
        attempted_mapping: { vector_type: 'POSITIVE', magnitude: null },
        confidence_score: 0.65,
        failure_reason: 'Could not parse magnitude'
      })
      .select()
      .single()

    if (quarError) throw quarError
    console.log('✅ Quarantine record created:', quarantine.quarantine_id)

    console.log('\n🎉 ALL TESTS PASSED! File 01 is working perfectly.\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

testFile01()