import { Package2 } from 'lucide-react';
import { CrudTable, CrudTableConfig } from '@/components/crud/CrudTable';

const palletsConfig: CrudTableConfig = {
  table: 'pallets',
  title: 'Pallets',
  description: 'Manage pallet specifications and dimensions',
  primaryKey: 'pallet_id',
  displayColumns: ['pallet_name', 'length_cm', 'width_cm', 'max_height_cm', 'max_weight_kg'],
  searchableColumns: ['pallet_name', 'pallet_id'],
  icon: Package2,
  fields: [
    { name: 'pallet_name', label: 'Pallet Name', type: 'text', required: true, placeholder: 'Enter pallet name' },
    { name: 'length_cm', label: 'Length (cm)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter length' },
    { name: 'width_cm', label: 'Width (cm)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter width' },
    { name: 'max_height_cm', label: 'Max Height (cm)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter max height' },
    { name: 'max_weight_kg', label: 'Max Weight (kg)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter max weight' },
    { name: 'max_volume_cm3', label: 'Max Volume (cm³)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter max volume' },
    { name: 'volumetric_efficiency', label: 'Volumetric Efficiency', min: 0, type: 'number',step: 0.01, placeholder: 'Enter efficiency' },
  ]
};

export default function Pallets() {
  return <CrudTable config={palletsConfig} />;
}