import { PackageSearch } from "lucide-react";
import { AddressAwareCrudTable } from "@/components/crud/AddressAwareCrudTable";
import { CrudTableConfig } from "@/components/crud/CrudTable";

const supplierProductsConfig: CrudTableConfig = {
  table: "customer_products",
  title: "Client Product Databases",
  description: "Manage products offered by customers with pricing and requirements information",
  primaryKey: "customer_id,product_id",
  displayColumns: [
    "customer_name",
    "product_name",
    "required_price",
    "currency_name",
    "required_quantity",
    "incoterm_name",
  ],
  searchableColumns: [
    "customer_name",
    "product_name",
    "required_price",
    "required_quantity",
    "currency_name",
    "credit_days",
    "incoterm_name",
    "volume_discount_percent",
  ],
  icon: PackageSearch,
  fields: [
    {
      name: "customer_id",
      label: "Client",
      type: "foreign_key",
      required: true,
      foreignTable: "customers",
      foreignKeyField: "customer_id",
      foreignDisplayField: "company_name",
    },
    {
      name: "product_id",
      label: "Product",
      type: "foreign_key",
      required: true,
      foreignTable: "products",
      foreignKeyField: "product_id",
      foreignDisplayField: "product_name",
    },
    {
      name: "required_price",
      label: "Required Price",
      type: "number",
      min: 0,
      step: 0.01,
      placeholder: "Enter required price",
    },
    {
      name: "currency_id",
      label: "Currency",
      type: "foreign_key",
      required: false,
      foreignTable: "currencies",
      foreignKeyField: "id",
      foreignDisplayField: "value",
    },
    {
      name: "required_quantity",
      label: "Required Quantity",
      type: "number",
      min: 1,
      placeholder: "Enter required quantity",
    },
    { name: "credit_days", label: "Credit Days", type: "number", min: 0, placeholder: "Enter credit days" },
    {
      name: "incoterm_id",
      label: "Incoterm",
      type: "foreign_key",
      required: false,
      foreignTable: "incoterms",
      foreignKeyField: "id",
      foreignDisplayField: "value",
    },
    {
      name: "volume_discount_percent",
      label: "Volume Discount (%)",
      type: "number",
      min: 0,
      max: 100,
      step: 0.01,
      placeholder: "Enter volume discount percentage",
    },
    { name: "customer_notes", label: "Customer Notes", type: "textarea", placeholder: "Enter customer notes" },
  ],
};

export default function SupplierProducts() {
  return (
    <AddressAwareCrudTable config={supplierProductsConfig} hasAddressFields={false} dataIsolation={{ mode: "none" }} />
  );
}
