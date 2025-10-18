import React from 'react';
import { AddressAwareCrudTable } from '../components/crud/AddressAwareCrudTable';
import { CrudTableConfig } from '../components/crud/CrudTable';
import { Building2 } from 'lucide-react';

const config: CrudTableConfig = {
  table: 'self_warehouses',
  title: 'Self Warehouses',
  description: 'Manage your own warehouse locations with full address and logistics information.',
  primaryKey: 'warehouse_id',
  displayColumns: ['warehouse_name', 'country', 'state', 'city', 'zip', 'street', 'logistics_zone', 'latitude', 'longitude'],
  searchableColumns: ['warehouse_name', 'country', 'state', 'city', 'logistics_zone'],
  icon: Building2,
  fields: [
    { name: 'warehouse_name', label: 'Warehouse Name', type: 'text', required: true },
    { name: 'logistics_zone', label: 'Logistics Zone', type: 'text', required: false },
    { name: 'latitude', label: 'Latitude', type: 'number', required: false },
    { name: 'longitude', label: 'Longitude', type: 'number', required: false },
    { name: 'address_country', label: 'Country', type: 'text', required: true },
    { name: 'address_state', label: 'State', type: 'text', required: true },
    { name: 'address_city', label: 'City', type: 'text', required: true },
    { name: 'address_zip', label: 'ZIP', type: 'text', required: true },
    { name: 'address_street', label: 'Street', type: 'text', required: true }
  ]
};

const SelfWarehouses: React.FC = () => {
  return (
    <AddressAwareCrudTable 
      config={config}
      hasAddressFields={true}
      addressJoinConfig={{
        addressIdField: 'address_id',
        displayFields: ['country', 'state', 'city', 'zip', 'street']
      }}
    />
  );
};

export default SelfWarehouses;
