-- Enable Row Level Security on tables only (excluding views)
-- This addresses the critical security finding: RLS Disabled in Public

-- ============================================================================
-- ENABLE RLS ON ACTUAL TABLES (EXCLUDING VIEWS)
-- ============================================================================

-- Enum/Lookup Tables (publicly readable for authenticated users)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoterms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inner_unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packaging_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes_by_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sellable_options ENABLE ROW LEVEL SECURITY;

-- Core Business Tables (require authentication)
ALTER TABLE public.address ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_distribution_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_unit_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_cost_suppliers ENABLE ROW LEVEL SECURITY;

-- Pricing and Optimization Tables (restricted access)
ALTER TABLE public.general_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_pricing_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_run_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_pricing_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_audit_trail ENABLE ROW LEVEL SECURITY;

-- Note: Skipping views like pricing_run_summaries, client_pricing_history, active_client_overrides
-- as RLS cannot be enabled on views - it applies to the underlying tables

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Enum/Lookup Tables - Read-only for authenticated users
CREATE POLICY "Authenticated users can read brands" ON public.brands
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read categories" ON public.categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read currencies" ON public.currencies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read incoterms" ON public.incoterms
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read inner_unit_types" ON public.inner_unit_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read location_origins" ON public.location_origins
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read packaging_types" ON public.packaging_types
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read relationship_levels" ON public.relationship_levels
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read routes_by_regions" ON public.routes_by_regions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read sellable_options" ON public.sellable_options
    FOR SELECT TO authenticated USING (true);

-- Core Business Tables - Full CRUD for authenticated users
CREATE POLICY "Authenticated users can manage addresses" ON public.address
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage customers" ON public.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage customer_distribution_centers" ON public.customer_distribution_centers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage pallets" ON public.pallets
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage routes" ON public.routes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage route_unit_quotes" ON public.route_unit_quotes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage self_warehouses" ON public.self_warehouses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage logistics_cost_suppliers" ON public.logistics_cost_suppliers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pricing Tables - Full access for authenticated users (business application)
CREATE POLICY "Authenticated users can manage general_pricing" ON public.general_pricing
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read general_pricing_rule" ON public.general_pricing_rule
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage pricing_optimization" ON public.pricing_optimization
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage pricing_runs" ON public.pricing_runs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage pricing_run_results" ON public.pricing_run_results
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read pricing_rule_versions" ON public.pricing_rule_versions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage client_pricing_overrides" ON public.client_pricing_overrides
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sourcing and Execution Tables
CREATE POLICY "Authenticated users can manage sourcing_executions" ON public.sourcing_executions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit Tables - Read-only for authenticated users
CREATE POLICY "Authenticated users can read pricing_audit_trail" ON public.pricing_audit_trail
    FOR SELECT TO authenticated USING (true);