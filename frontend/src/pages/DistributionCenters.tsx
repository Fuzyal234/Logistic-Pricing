import { MapPin } from "lucide-react";
import { AddressAwareCrudTable } from "@/components/crud/AddressAwareCrudTable";
import { CrudTableConfig } from "@/components/crud/CrudTable";

const distributionCentersConfig: CrudTableConfig = {
  table: "customer_distribution_centers",
  title: "Distribution Centers",
  description: "Manage customer distribution centers and delivery locations",
  primaryKey: "distribution_center_id",
  displayColumns: [
    "distribution_center_name",
    "customer_name",
    "country",
    "state",
    "city",
    "zip",
    "street",
    "logistics_zone",
    "latitude",
    "longitude",
  ],
  searchableColumns: [
    "distribution_center_name",
    "logistics_zone",
    "customer_name",
    "country",
    "state",
    "city",
    "zip",
    "street",
  ],
  icon: MapPin,
  fields: [
    {
      name: "customer_id",
      label: "Customer",
      type: "foreign_key",
      required: true,
      foreignTable: "customers",
      foreignKeyField: "customer_id",
      foreignDisplayField: "company_name",
    },
    {
      name: "distribution_center_name",
      label: "Distribution Center Name",
      type: "text",
      required: true,
      placeholder: "Enter distribution center name",
    },
    { name: "logistics_zone", label: "Logistics Zone", type: "text", placeholder: "Enter logistics zone" },
    { name: "address_country", label: "Country", type: "text", placeholder: "Enter country" },
    { name: "address_state", label: "State", type: "text", placeholder: "Enter state" },
    { name: "address_city", label: "City", type: "text", placeholder: "Enter city" },
    { name: "address_zip", label: "Zip Code", type: "text", placeholder: "Enter zip code" },
    { name: "address_street", label: "Street Address", type: "text", placeholder: "Enter street address" },
    { name: "latitude", label: "Latitude", type: "number", step: 0.000001, placeholder: "Enter latitude" },
    { name: "longitude", label: "Longitude", type: "number", step: 0.000001, placeholder: "Enter longitude" },
  ],
};

export default function DistributionCenters() {
  return (
    <AddressAwareCrudTable
      config={distributionCentersConfig}
      hasAddressFields={true}
      addressJoinConfig={{
        addressIdField: "address_id",
        displayFields: ["country", "state", "city", "zip", "street"],
      }}
      dataIsolation={{ mode: "none" }}
    />
  );
}
