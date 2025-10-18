export interface EnumValue {
  id: string;
  value: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnumTable {
  table_name: string;
  display_name: string;
  description: string;
}

export interface EnumManagementView {
  table_name: string;
  display_name: string;
  description: string;
  record_count: number;
  active_count: number;
}
