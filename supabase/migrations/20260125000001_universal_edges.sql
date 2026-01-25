-- Replace 4 restaurant-only edges with 8 universal Main Street edges
-- Execution: Run this in Supabase SQL Editor

-- Drop old restaurant-specific edges
DROP VIEW IF EXISTS edge_food_cost_pct;
DROP VIEW IF EXISTS edge_labor_cost_pct;
DROP VIEW IF EXISTS edge_revenue_trend;
DROP VIEW IF EXISTS edge_yield;

-- 1. Cost Percentage (universal COGS)
CREATE VIEW edge_cost_pct AS
SELECT
  org_id,
  (SUM(CASE WHEN vector_type = 'NEGATIVE' THEN magnitude ELSE 0 END) /
   NULLIF(SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END), 0)) * 100 AS cost_pct,
  COUNT(*) AS fact_count,
  MIN(temporal_anchor) AS period_start,
  MAX(temporal_anchor) AS period_end
FROM atomic_fact_spine
GROUP BY org_id;

-- 2. Labor Percentage
CREATE VIEW edge_labor_pct AS
SELECT
  org_id,
  (SUM(CASE WHEN vector_type = 'NEGATIVE' AND triad_map->>'category' = 'labor' THEN magnitude ELSE 0 END) /
   NULLIF(SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END), 0)) * 100 AS labor_pct,
  SUM(CASE WHEN vector_type = 'NEGATIVE' AND triad_map->>'category' = 'labor' THEN magnitude ELSE 0 END) AS total_labor_cost
FROM atomic_fact_spine
GROUP BY org_id;

-- 3. Margin by Category
CREATE VIEW edge_margin_by_category AS
SELECT
  org_id,
  triad_map->>'category' AS category,
  SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) AS revenue,
  SUM(CASE WHEN vector_type = 'NEGATIVE' THEN magnitude ELSE 0 END) AS costs,
  (SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) -
   SUM(CASE WHEN vector_type = 'NEGATIVE' THEN magnitude ELSE 0 END)) AS profit,
  ((SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) -
    SUM(CASE WHEN vector_type = 'NEGATIVE' THEN magnitude ELSE 0 END)) /
   NULLIF(SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END), 0)) * 100 AS margin_pct
FROM atomic_fact_spine
WHERE triad_map->>'category' IS NOT NULL
GROUP BY org_id, triad_map->>'category';

-- 4. Top Items by Revenue
CREATE VIEW edge_top_items_by_revenue AS
SELECT
  org_id,
  triad_map->>'description' AS item,
  SUM(magnitude) AS total_revenue,
  COUNT(*) AS transaction_count,
  AVG(magnitude) AS avg_transaction
FROM atomic_fact_spine
WHERE vector_type = 'POSITIVE' AND triad_map->>'description' IS NOT NULL
GROUP BY org_id, triad_map->>'description'
ORDER BY total_revenue DESC;

-- 5. Daily Sales Trend
CREATE VIEW edge_daily_sales_trend AS
SELECT
  org_id,
  DATE(temporal_anchor) AS date,
  SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) AS daily_revenue,
  SUM(CASE WHEN vector_type = 'NEGATIVE' THEN magnitude ELSE 0 END) AS daily_costs,
  (SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) -
   SUM(CASE WHEN vector_type = 'NEGATIVE' THEN magnitude ELSE 0 END)) AS daily_profit,
  COUNT(*) AS transaction_count
FROM atomic_fact_spine
GROUP BY org_id, DATE(temporal_anchor)
ORDER BY date DESC;

-- 6. Peak Hours
CREATE VIEW edge_peak_hours AS
SELECT
  org_id,
  EXTRACT(HOUR FROM temporal_anchor::timestamp) AS hour,
  COUNT(*) AS transaction_count,
  SUM(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) AS hourly_revenue,
  AVG(CASE WHEN vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) AS avg_transaction
FROM atomic_fact_spine
WHERE temporal_anchor IS NOT NULL
GROUP BY org_id, EXTRACT(HOUR FROM temporal_anchor::timestamp)
ORDER BY hourly_revenue DESC;

-- 7. Waste Percentage
CREATE VIEW edge_waste_percentage AS
SELECT
  org_id,
  SUM(CASE WHEN triad_map->>'category' = 'waste' THEN magnitude ELSE 0 END) AS total_waste,
  SUM(CASE WHEN triad_map->>'category' IN ('food', 'inventory', 'product') THEN magnitude ELSE 0 END) AS total_inventory,
  (SUM(CASE WHEN triad_map->>'category' = 'waste' THEN magnitude ELSE 0 END) /
   NULLIF(SUM(CASE WHEN triad_map->>'category' IN ('food', 'inventory', 'product') THEN magnitude ELSE 0 END), 0)) * 100 AS waste_pct
FROM atomic_fact_spine
WHERE vector_type = 'NEGATIVE'
GROUP BY org_id;

-- 8. Inventory Turnover
CREATE VIEW edge_inventory_turnover AS
SELECT
  org_id,
  SUM(CASE WHEN triad_map->>'category' IN ('inventory', 'product') AND vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) AS revenue_from_inventory,
  AVG(CASE WHEN triad_map->>'category' IN ('inventory', 'product') THEN magnitude ELSE 0 END) AS avg_inventory_value,
  (SUM(CASE WHEN triad_map->>'category' IN ('inventory', 'product') AND vector_type = 'POSITIVE' THEN magnitude ELSE 0 END) /
   NULLIF(AVG(CASE WHEN triad_map->>'category' IN ('inventory', 'product') THEN magnitude ELSE 0 END), 0)) AS turnover_rate
FROM atomic_fact_spine
GROUP BY org_id;
