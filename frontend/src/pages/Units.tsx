import { Truck } from 'lucide-react';
import { CrudTable, CrudTableConfig } from '@/components/crud/CrudTable';

const unitsConfig: CrudTableConfig = {
  table: 'units',
  title: 'Units',
  description: 'Manage transportation units and their specifications',
  primaryKey: 'unit_id',
  displayColumns: ['unit', 'max_volume_m3', 'max_weight_kg', 'max_pallets'],
  searchableColumns: ['unit', 'unit_id'],
  icon: Truck,
  fields: [
    { name: 'unit', label: 'Unit Name', type: 'text', required: true, placeholder: 'Enter unit name' },
    { name: 'max_volume_m3', label: 'Max Volume (m³)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter max volume' },
    { name: 'max_weight_kg', label: 'Max Weight (kg)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter max weight' },
    { name: 'max_pallets', label: 'Max Pallets', type: 'number', min: 0, step: 1, placeholder: 'Enter max pallets' },
  ]
};

export default function Units() {
  return <CrudTable config={unitsConfig} />;
}