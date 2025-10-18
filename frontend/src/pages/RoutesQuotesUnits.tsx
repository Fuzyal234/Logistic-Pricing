import { Network } from 'lucide-react';
import { RouteAwareCrudTable } from '@/components/crud/RouteAwareCrudTable';
import { CrudTableConfig } from '@/components/crud/CrudTable';

const routesQuotesUnitsConfig: CrudTableConfig = {
  table: 'route_unit_quotes',
  title: 'Route Unit Quotes',
  description: 'Manage logistics supplier quotes for different routes and transportation units',
  primaryKey: 'route_id,logistics_supplier_id,unit_id',
  displayColumns: ['route_id', 'logistics_supplier_id', 'unit_id', 'route_by_region_id', 'max_pallets', 'cost_per_pallet', 'cost', 'distance_km', 'estimated_time_hrs', 'origin', 'destination'],
  searchableColumns: ['route_id', 'logistics_supplier_id', 'unit_id', 'cost', 'distance_km', 'estimated_time_hrs', 'origin', 'destination'],
  icon: Network,
  fields: [
    { name: 'route_id', label: 'Route', type: 'foreign_key', required: true, foreignTable: 'routes', foreignKeyField: 'route_id', foreignDisplayField: 'route_code' },
    { name: 'logistics_supplier_id', label: 'Logistics Supplier', type: 'foreign_key', required: true, foreignTable: 'logistics_cost_suppliers', foreignKeyField: 'logistics_supplier_id', foreignDisplayField: 'name' },
    { name: 'unit_id', label: 'Transportation Unit', type: 'foreign_key', required: true, foreignTable: 'units', foreignKeyField: 'unit_id', foreignDisplayField: 'unit' },
    { 
      name: 'route_by_region_id', 
      label: 'Route Region', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'routes_by_regions', 
      foreignKeyField: 'id', 
      foreignDisplayField: 'value' 
    },
    { name: 'cost', label: 'Total Cost', type: 'number', required: false, min: 0, step: 0.01, placeholder: 'Auto-calculated from Max Pallets × Cost Per Pallet', readonly: true },
    { name: 'max_pallets', label: 'Max Pallets', type: 'number', required: false, min: 0, step: 1, placeholder: 'Enter maximum pallets' },
    { name: 'cost_per_pallet', label: 'Cost per Pallet', type: 'number', required: false, min: 0, step: 0.01, placeholder: 'Enter cost per pallet' },
    { name: 'distance_km', label: 'Distance (km)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter distance in kilometers' },
    { name: 'estimated_time_hrs', label: 'Estimated Time (hrs)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter estimated time in hours' },
    { name: 'origin', label: 'Origin', type: 'text', readonly: true, placeholder: 'Auto-filled from selected route' },
    { name: 'destination', label: 'Destination', type: 'text', readonly: true, placeholder: 'Auto-filled from selected route' },
  ]
};

export default function RoutesQuotesUnits() {
  return <RouteAwareCrudTable config={routesQuotesUnitsConfig} />;
}