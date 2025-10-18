import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { EnumValue, EnumTable, EnumManagementView } from '../types/enums';
import { useToast } from './use-toast';

export const useEnums = () => {
  const [enumTables, setEnumTables] = useState<EnumTable[]>([]);
  const [enumValues, setEnumValues] = useState<EnumValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const { toast } = useToast();

  // Define all enum tables
  const allEnumTables: EnumTable[] = [
    { table_name: 'relationship_levels', display_name: 'Relationship Levels', description: 'Primary and Secondary relationship types' },
    { table_name: 'variation_themes', display_name: 'Variation Themes', description: 'Product variation categories' },
    { table_name: 'brands', display_name: 'Brands', description: 'Product brand names' },
    { table_name: 'categories', display_name: 'Categories', description: 'Product categories' },
    { table_name: 'variation_theme_values', display_name: 'Variation Theme Values', description: 'Specific variation values' },
    { table_name: 'units_of_measurements', display_name: 'Units of Measurement', description: 'Measurement units' },
    { table_name: 'packaging_types', display_name: 'Packaging Types', description: 'Product packaging options' },
    { table_name: 'inner_unit_types', display_name: 'Inner Unit Types', description: 'Inner unit packaging types' },
    { table_name: 'sellable_options', display_name: 'Sellable Options', description: 'Product sellability status' },
    { table_name: 'currencies', display_name: 'Currencies', description: 'Available currencies' },
    { table_name: 'incoterms', display_name: 'Incoterms', description: 'International trade terms' },
    { table_name: 'location_origins', display_name: 'Location Origin', description: 'Origin locations for products and shipments' },
    { table_name: 'routes_by_regions', display_name: 'Routes by Regions', description: 'Geographic regions for organizing routes' }
  ];

  useEffect(() => {
    setEnumTables(allEnumTables);
  }, []);

  // Load enum values for a specific table
  const loadEnumValues = async (tableName: string) => {
    if (!tableName) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Transform data to match EnumValue interface
      const transformedData = (data || []).map((item: any) => ({
        id: item.id || Math.random().toString(),
        value: item.value || item.name || 'Unknown',
        display_order: item.display_order || 1,
        is_active: item.is_active !== false,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
      
      setEnumValues(transformedData);
      setSelectedTable(tableName);
    } catch (error) {
      console.error('Error loading enum values:', error);
      toast({
        title: "Error",
        description: "Failed to load enum values",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add new enum value
  const addEnumValue = async (tableName: string, value: string, displayOrder?: number) => {
    try {
      const newValue = {
        value,
        display_order: displayOrder || (enumValues.length + 1),
        is_active: true
      };

      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(newValue)
        .select()
        .single();

      if (error) throw error;

      const transformedData = {
        id: data.id || Math.random().toString(),
        value: data.value || data.name || 'Unknown',
        display_order: data.display_order || 1,
        is_active: data.is_active !== false,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      setEnumValues(prev => [...prev, transformedData]);
      toast({
        title: "Success",
        description: "Enum value added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding enum value:', error);
      toast({
        title: "Error",
        description: "Failed to add enum value",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update enum value
  const updateEnumValue = async (tableName: string, id: string, updates: Partial<EnumValue>) => {
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedData = {
        id: data.id || id,
        value: data.value || data.name || 'Unknown',
        display_order: data.display_order || 1,
        is_active: data.is_active !== false,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      setEnumValues(prev => prev.map(item => item.id === id ? transformedData : item));
      toast({
        title: "Success",
        description: "Enum value updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating enum value:', error);
      toast({
        title: "Error",
        description: "Failed to update enum value",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Delete enum value
  const deleteEnumValue = async (tableName: string, id: string) => {
    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEnumValues(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Enum value deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting enum value:', error);
      toast({
        title: "Error",
        description: "Failed to delete enum value",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Toggle enum value active status
  const toggleEnumValueStatus = async (tableName: string, id: string, isActive: boolean) => {
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const transformedData = {
        id: data.id || id,
        value: data.value || data.name || 'Unknown',
        display_order: data.display_order || 1,
        is_active: data.is_active !== false,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      setEnumValues(prev => prev.map(item => item.id === id ? transformedData : item));
      toast({
        title: "Success",
        description: `Enum value ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      return data;
    } catch (error) {
      console.error('Error toggling enum value status:', error);
      toast({
        title: "Error",
        description: "Failed to update enum value status",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Reorder enum values
  const reorderEnumValues = async (tableName: string, reorderedValues: EnumValue[]) => {
    try {
      const updates = reorderedValues.map((item, index) => ({
        id: item.id,
        display_order: index + 1
      }));

      const { error } = await (supabase as any)
        .from(tableName)
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      setEnumValues(reorderedValues);
      toast({
        title: "Success",
        description: "Enum values reordered successfully",
      });
    } catch (error) {
      console.error('Error reordering enum values:', error);
      toast({
        title: "Error",
        description: "Failed to reorder enum values",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    enumTables,
    enumValues,
    loading,
    selectedTable,
    loadEnumValues,
    addEnumValue,
    updateEnumValue,
    deleteEnumValue,
    toggleEnumValueStatus,
    reorderEnumValues,
    setSelectedTable
  };
};
