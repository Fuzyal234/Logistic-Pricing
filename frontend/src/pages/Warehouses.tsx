import { Warehouse } from 'lucide-react';
import { CrudTableConfig } from '@/components/crud/CrudTable';
import { AddressAwareCrudTable } from '@/components/crud/AddressAwareCrudTable';

const warehousesConfig: CrudTableConfig = {
  table: 'supplier_warehouses',
  title: 'Warehouses',
  description: 'Manage supplier warehouse locations and logistics information',
  primaryKey: 'warehouse_id',
  displayColumns: [
    'warehouse_name',
    'supplier_name',
    'country',
    'state',
    'city',
    'zip',
    'street',
    'logistics_zone',
    'latitude',
    'longitude'
  ],
  searchableColumns: ['warehouse_name', 'supplier_name', 'logistics_zone', 'country', 'state', 'city', 'zip', 'street'],
  icon: Warehouse,
  fields: [
    {
      name: 'supplier_id',
      label: 'Supplier',
      type: 'foreign_key',
      required: true,
      placeholder: 'Select supplier',
      foreignTable: 'suppliers',
      foreignKeyField: 'supplier_id',
      foreignDisplayField: 'name'
    },
    {
      name: 'warehouse_name',
      label: 'Warehouse Name',
      type: 'text',
      required: true,
      placeholder: 'Enter warehouse name'
    },
        // Address fields (join mode, saved in address table)
    { name: 'address_country', label: 'Country', type: 'text', placeholder: 'Enter country' },
    { name: 'address_state', label: 'State', type: 'text', placeholder: 'Enter state' },
    { name: 'address_city', label: 'City', type: 'text', placeholder: 'Enter city' },
    { name: 'address_zip', label: 'Zip Code', type: 'text', placeholder: 'Enter zip code' },
    { name: 'address_street', label: 'Street Address', type: 'text', placeholder: 'Enter street address' },
    // Other warehouse fields
    {
      name: 'logistics_zone',
      label: 'Logistics Zone',
      type: 'text',
      placeholder: 'Enter logistics zone'
    },
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      step: 0.000001,
      placeholder: 'Enter latitude coordinates'
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      step: 0.000001,
      placeholder: 'Enter longitude coordinates'
    }
  ]
};

export default function Warehouses() {
  return <AddressAwareCrudTable 
          config={warehousesConfig}
          hasAddressFields
          addressJoinConfig={{ addressIdField: 'address_id', displayFields: ['country','state','city','zip','street'] }}
        />;
}
