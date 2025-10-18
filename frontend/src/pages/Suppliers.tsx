import { Building2 } from 'lucide-react';
import { AddressAwareCrudTable } from '@/components/crud/AddressAwareCrudTable';
import { CrudTableConfig } from '@/components/crud/CrudTable';

const suppliersConfig: CrudTableConfig = {
  table: 'suppliers',
  title: 'Suppliers',
  description: 'Manage your supplier network and contact information',
  primaryKey: 'supplier_id',
  displayColumns: ['name', 'company_name', 'email', 'phone', 'is_company', 'country', 'state', 'city', 'zip', 'street'],
  searchableColumns: ['name', 'company_name', 'email', 'country', 'state', 'city', 'zip', 'street'],
  icon: Building2,
  fields: [
    { name: 'name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter contact name' },
    { name: 'company_name', label: 'Company Name', type: 'text', placeholder: 'Enter company name' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: 'Enter phone number' },
    { name: 'mobile', label: 'Mobile', type: 'tel', placeholder: 'Enter mobile number' },
    { name: 'is_company', label: 'Is Company', type: 'toggle' },
    { name: 'vat', label: 'VAT Number', type: 'text', placeholder: 'Enter VAT number' },
    { name: 'bank_ids_bank', label: 'Bank Name', type: 'text', placeholder: 'Enter bank name' },
    { name: 'bank_ids_account_number', label: 'Bank Account Number', type: 'text', placeholder: 'Enter account number' },
    // Address fields (join mode, saved in address table)
    { name: 'address_country', label: 'Country', type: 'text', placeholder: 'Enter country' },
    { name: 'address_state', label: 'State', type: 'text', placeholder: 'Enter state' },
    { name: 'address_city', label: 'City', type: 'text', placeholder: 'Enter city' },
    { name: 'address_zip', label: 'Zip Code', type: 'text', placeholder: 'Enter zip code' },
    { name: 'address_street', label: 'Street Address', type: 'text', placeholder: 'Enter street address' },
  ]
};

export default function Suppliers() {
  return (
    <AddressAwareCrudTable 
      config={suppliersConfig} 
      hasAddressFields={true}
      addressJoinConfig={{
        addressIdField: 'address_id',
        displayFields: ['country', 'state', 'city', 'zip', 'street']
      }}
    />
  );
}