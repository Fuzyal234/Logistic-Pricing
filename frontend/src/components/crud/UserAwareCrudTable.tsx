/**
 * UserAwareCrudTable - CRUD table for user-owned entities
 *
 * This is a convenience wrapper around AddressAwareCrudTable configured
 * for user-based data isolation (filters by user_id).
 *
 * @deprecated Use AddressAwareCrudTable with dataIsolation={{ mode: 'user' }} instead
 */

import { AddressAwareCrudTable } from "./AddressAwareCrudTable";
import type { CrudTableConfig } from "./CrudTable";

interface UserAwareCrudTableProps {
  config: CrudTableConfig;
  hasAddressFields?: boolean;
  addressJoinConfig?: {
    addressIdField: string;
    displayFields: string[];
  };
}

/**
 * @example
 * <UserAwareCrudTable
 *   config={customersConfig}
 *   hasAddressFields={true}
 *   addressJoinConfig={{ addressIdField: 'address_id', displayFields: ['country', 'city'] }}
 * />
 */
export function UserAwareCrudTable(props: UserAwareCrudTableProps) {
  return <AddressAwareCrudTable {...props} dataIsolation={{ mode: "user", userIdField: "user_id" }} />;
}
