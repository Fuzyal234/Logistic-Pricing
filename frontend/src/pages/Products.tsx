import { Package } from 'lucide-react';
import { CrudTable, CrudTableConfig } from '@/components/crud/CrudTable';

const productsConfig: CrudTableConfig = {
  table: 'products',
  title: 'Products',
  description: 'Manage your product catalog with detailed specifications and pricing',
  primaryKey: 'product_id',
  displayColumns: ['product_name', 'category_id', 'brand_id', 'sku', 'active', 'sellable_id'],
  searchableColumns: ['product_name', 'sku', 'barcode'],
  icon: Package,
  fields: [
    { name: 'product_name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
    { name: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'Enter SKU' },
    { 
      name: 'relationship_level_id', 
      label: 'Relationship Level', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'relationship_levels',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { name: 'sku_principal', label: 'Principal SKU', type: 'text', placeholder: 'Enter principal SKU' },
    { 
      name: 'variation_theme_id', 
      label: 'Variation Theme', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'variation_themes',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { name: 'variation_theme_name', label: 'Variation Theme Name', type: 'text', placeholder: 'Enter variation theme name' },
    { 
      name: 'brand_id', 
      label: 'Brand', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'brands',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { 
      name: 'category_id', 
      label: 'Category', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'categories',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { 
      name: 'variation_theme_value_id', 
      label: 'Variation Theme Value', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'variation_theme_values',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { name: 'size', label: 'Size', type: 'number', min: 0, step: 0.01, placeholder: 'Enter size' },
    { 
      name: 'units_of_measurement_id', 
      label: 'Units of Measurement', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'units_of_measurements',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { 
      name: 'packaging_type_id', 
      label: 'Packaging Type', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'packaging_types',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { name: 'units', label: 'Units', type: 'number', min: 1, placeholder: 'Enter units' },
    { 
      name: 'inner_unit_type_id', 
      label: 'Inner Unit Type', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'inner_unit_types',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { name: 'length_cm', label: 'Length (cm)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter length' },
    { name: 'width_cm', label: 'Width (cm)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter width' },
    { name: 'height_cm', label: 'Height (cm)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter height' },
    { name: 'weight_kg', label: 'Weight (kg)', type: 'number', min: 0, step: 0.001, placeholder: 'Enter weight' },
    { name: 'volume_cm3', label: 'Volume (cm³)', type: 'number', min: 0, step: 0.01, placeholder: 'Enter volume' },
    { name: 'units_per_layer', label: 'Units per Layer', type: 'number', min: 1, placeholder: 'Enter units per layer' },
    { name: 'number_of_layers_per_pallet', label: 'Layers per Pallet', type: 'number', min: 1, placeholder: 'Enter layers per pallet' },
    { name: 'pieces_per_pallet', label: 'Pieces per Pallet', type: 'number', min: 1, placeholder: 'Enter pieces per pallet' },
    { name: 'barcode', label: 'Barcode', type: 'text', placeholder: 'Enter barcode' },
    { name: 'vat_percent', label: 'VAT (%)', type: 'number', min: 0, max: 100, step: 0.01, placeholder: 'Enter VAT percentage' },
    { name: 'ieps_percent', label: 'IEPS (%)', type: 'number', min: 0, max: 100, step: 0.01, placeholder: 'Enter IEPS percentage' },
    { name: 'special_tax_percent', label: 'Special Tax (%)', type: 'number', min: 0, max: 100, step: 0.01, placeholder: 'Enter special tax percentage' },
    { 
      name: 'sellable_id', 
      label: 'Sellable', 
      type: 'foreign_key', 
      required: false,
      foreignTable: 'sellable_options',
      foreignKeyField: 'id',
      foreignDisplayField: 'value'
    },
    { name: 'active', label: 'Active', type: 'select', options: ['Yes', 'No'] },
    { name: 'cost_group', label: 'Cost Group', type: 'text', placeholder: 'Enter cost group' },
    { name: 'product_image', label: 'Product Image', type: 'file' },
    { name: 'msrp', label: 'MSRP', type: 'number', min: 0, step: 0.01, placeholder: 'Enter MSRP' },
    { name: 'tags', label: 'Tags', type: 'textarea', placeholder: 'Enter tags (comma-separated)' },
  ]
};

export default function Products() {
  return <CrudTable config={productsConfig} />;
}