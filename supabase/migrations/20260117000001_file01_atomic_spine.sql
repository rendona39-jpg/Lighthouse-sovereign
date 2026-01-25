-- FILE 01: THE IDENTITY CONSTITUTION
-- Section 1: Triadic Data Model

CREATE DOMAIN decimal18_6 AS NUMERIC(18,6);

CREATE TYPE vector_type AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- Section 2: Provenance Chain

CREATE TABLE provenance_ledger (
  provenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  blob_storage_path TEXT NOT NULL,
  coordinate_map JSONB NOT NULL,
  sha256_hash TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL,
  original_filename TEXT,
  file_size_bytes INTEGER,
  ingest_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_coordinate_map CHECK (jsonb_typeof(coordinate_map) = 'object')
);

CREATE INDEX idx_provenance_org ON provenance_ledger(org_id);
CREATE INDEX idx_provenance_hash ON provenance_ledger(sha256_hash);

-- Section 3: Atomic Fact Spine

CREATE TABLE atomic_fact_spine (
  fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  vector_type vector_type NOT NULL,
  magnitude decimal18_6 NOT NULL CHECK (magnitude >= 0),
  temporal_anchor TIMESTAMPTZ NOT NULL,
  triad_map JSONB NOT NULL,
  provenance_id UUID NOT NULL REFERENCES provenance_ledger(provenance_id) ON DELETE RESTRICT,
  confidence FLOAT NOT NULL CHECK (confidence > 0.992 AND confidence <= 1.0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_triad_map CHECK (jsonb_typeof(triad_map) = 'object')
);

CREATE INDEX idx_spine_org_temporal ON atomic_fact_spine(org_id, temporal_anchor DESC);
CREATE INDEX idx_spine_vector_type ON atomic_fact_spine(vector_type);
CREATE INDEX idx_spine_provenance ON atomic_fact_spine(provenance_id);
CREATE INDEX idx_spine_confidence ON atomic_fact_spine(confidence);

-- Section 4: Immutability Enforcement

CREATE OR REPLACE FUNCTION enforce_spine_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Atomic facts are immutable. Use counter-facts for corrections.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_spine_mutation
  BEFORE UPDATE OR DELETE ON atomic_fact_spine
  FOR EACH ROW EXECUTE FUNCTION enforce_spine_immutability();

CREATE TRIGGER prevent_provenance_mutation
  BEFORE UPDATE OR DELETE ON provenance_ledger
  FOR EACH ROW EXECUTE FUNCTION enforce_spine_immutability();

-- Section 5: Quarantine Ledger

CREATE TABLE quarantine_ledger (
  quarantine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  raw_data JSONB NOT NULL,
  attempted_mapping JSONB,
  confidence_score FLOAT NOT NULL CHECK (confidence_score < 0.992),
  failure_reason TEXT,
  disambiguation_status TEXT DEFAULT 'PENDING',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_quarantine_org_status ON quarantine_ledger(org_id, disambiguation_status);

-- Section 6: Row-Level Security

ALTER TABLE atomic_fact_spine ENABLE ROW LEVEL SECURITY;
ALTER TABLE provenance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarantine_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_spine" ON atomic_fact_spine
  FOR ALL 
  USING (
    org_id::text = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'org_id',
      current_setting('app.current_org_id', true)
    )
  );

CREATE POLICY "org_isolation_provenance" ON provenance_ledger
  FOR ALL 
  USING (
    org_id::text = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'org_id',
      current_setting('app.current_org_id', true)
    )
  );

CREATE POLICY "org_isolation_quarantine" ON quarantine_ledger
  FOR ALL 
  USING (
    org_id::text = COALESCE(
      current_setting('request.jwt.claims', true)::json->>'org_id',
      current_setting('app.current_org_id', true)
    )
  );