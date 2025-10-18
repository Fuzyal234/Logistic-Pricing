import { Truck } from "lucide-react";
import { CrudTable, CrudTableConfig } from "@/components/crud/CrudTable";

const logisticsProvidersConfig: CrudTableConfig = {
  table: "logistics_cost_suppliers",
  title: "Logistics Suppliers",
  description: "Manage logistics and transportation service providers",
  primaryKey: "logistics_supplier_id",
  displayColumns: ["name", "supplier_type", "contact", "phone", "email"],
  searchableColumns: ["name", "supplier_type", "contact", "rfc"],
  icon: Truck,
  fields: [
    { name: "name", label: "Logistics Supplier Name", type: "text", required: true, placeholder: "Enter company name" },
    {
      name: "supplier_type",
      label: "Supplier Type",
      type: "text",
      placeholder: "Enter supplier type (Carrier/Forwarder/Other)",
    },
    { name: "contact", label: "Contact Person", type: "text", placeholder: "Enter contact person name" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "Enter phone number" },
    { name: "email", label: "Email", type: "email", placeholder: "Enter email address" },
    { name: "rfc", label: "RFC", type: "text", placeholder: "Enter RFC number" },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Enter additional notes" },
  ],
};

export default function LogisticsProviders() {
  return <CrudTable config={logisticsProvidersConfig} />;
}
