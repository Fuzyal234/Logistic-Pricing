/**
 * CustomerRelatedCrudTable - CRUD table for customer-related entities
 *
 * This is a convenience wrapper around AddressAwareCrudTable configured
 * for customer-based data isolation (filters by customer_id where customers
 * belong to the logged-in user).
 *
 * @deprecated Use AddressAwareCrudTable with dataIsolation={{ mode: 'customer-related' }} instead
 */

import { AddressAwareCrudTable } from "./AddressAwareCrudTable";
import type { CrudTableConfig } from "./CrudTable";

interface CustomerRelatedCrudTableProps {
  config: CrudTableConfig;
  hasAddressFields?: boolean;
  addressJoinConfig?: {
    addressIdField: string;
    displayFields: string[];
  };
}

/**
 * @example
 * <CustomerRelatedCrudTable
 *   config={distributionCentersConfig}
 *   hasAddressFields={true}
 *   addressJoinConfig={{ addressIdField: 'address_id', displayFields: ['country', 'city'] }}
 * />
 */
export function CustomerRelatedCrudTable(props: CustomerRelatedCrudTableProps) {
  return (
    <AddressAwareCrudTable {...props} dataIsolation={{ mode: "customer-related", customerIdField: "customer_id" }} />
  );
}
