import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, Plus, Edit, Trash2, Download, Upload, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CrudForm, FieldConfig } from "./CrudForm";
import { convertToCSV, downloadCSV, parseCSV, validateCSVData, createCSVTemplate } from "@/lib/csvUtils";

export type { FieldConfig };
import type { LucideIcon } from "lucide-react";

/* -------------------------------
   Interfaces
---------------------------------*/
export interface CrudTableConfig {
  table: string;
  title: string;
  description: string;
  primaryKey: string;
  displayColumns: string[];
  searchableColumns: string[];
  icon: LucideIcon;
  fields: FieldConfig[];
  validateBeforeCreate?: (data: any) => Promise<{ valid: boolean; error?: string }>;
}

export interface CrudTableProps {
  config: CrudTableConfig;
  hasAddressFields?: boolean;
  routeAware?: boolean;
}

/* -------------------------------
   Component
---------------------------------*/
export function CrudTable({ config, hasAddressFields, routeAware }: CrudTableProps) {
  /* -------------------------------
     Local State
  ---------------------------------*/
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [isCSVUploadDialogOpen, setIsCSVUploadDialogOpen] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvErrors, setCSVErrors] = useState<string[]>([]);

  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const buildQuery = (searchTerm: string, from: number, to: number) => {
    let query = (supabase as any).from(config.table).select("*", { count: "exact" }).range(from, to);

    if (searchTerm.trim()) {
      const foreignKeySearchColumns = config.searchableColumns.filter((column) => {
        const field = config.fields.find((f) => f.name === column);
        return field && field.type === "foreign_key";
      });

      const uuidFields = [
        "product_id", "pallet_id", "unit_id", "supplier_id", "customer_id",
        "address_id", "warehouse_id", "distribution_center_id", "route_id", "logistics_supplier_id",
      ];
      const enumFields = [
        "category", "brand", "relationship_level", "variation_theme", "variation_theme_value",
        "packaging_type", "inner_unit_type", "units_of_measurement", "sellable", "active", "currency", "incoterm",
      ];
      const numericFields = config.searchableColumns.filter((column) => {
        const field = config.fields.find((f) => f.name === column);
        return field && field.type === "number";
      });

      const hasUuidSearchColumns = config.searchableColumns.some((column) => uuidFields.includes(column));
      const hasEnumSearchColumns = config.searchableColumns.some((column) => enumFields.includes(column));
      const hasNumericSearchColumns = numericFields.length > 0;

      if (foreignKeySearchColumns.length > 0 || hasUuidSearchColumns || hasEnumSearchColumns || hasNumericSearchColumns) {
        return query;
      } else {
        const searchableColumns = config.searchableColumns.filter((column) => {
          const field = config.fields.find((f) => f.name === column);
          return !uuidFields.includes(column) && !enumFields.includes(column) && !(field && field.type === "number");
        });

        if (searchableColumns.length > 0) {
          const searchConditions = searchableColumns.map((column) => `${column}.ilike.%${searchTerm}%`).join(",");
          if (searchConditions) {
            query = query.or(searchConditions);
          }
        }
      }
    }

    return query;
  };

  /* -------------------------------
     Data Fetching
  ---------------------------------*/
  const { data, isLoading, error } = useQuery({
    queryKey: [config.table, searchTerm, page],
    queryFn: async () => {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await buildQuery(searchTerm, from, to);
      if (error) throw error;

      const foreignKeyFields = config.fields.filter((field) => field.type === "foreign_key");
      const hasForeignKeyDisplay = foreignKeyFields.some((field) => config.displayColumns.includes(field.name));

      if (hasForeignKeyDisplay && data) {
        for (const field of foreignKeyFields) {
          if (config.displayColumns.includes(field.name)) {
            const { data: foreignData, error: foreignError } = await (supabase as any)
              .from(field.foreignTable!)
              .select(`${field.foreignKeyField}, ${field.foreignDisplayField}`);

            if (!foreignError && foreignData) {
              const lookupMap = new Map();
              foreignData.forEach((item: any) => {
                lookupMap.set(item[field.foreignKeyField!], item[field.foreignDisplayField!]);
              });

              data.forEach((record: any) => {
                const key = record[field.name];
                if (key && lookupMap.has(key)) {
                  record[`${field.name}_display`] = lookupMap.get(key);
                }
              });
            }
          }
        }
      }

      if (searchTerm.trim()) {
        const foreignKeySearchColumns = config.searchableColumns.filter((column) => {
          const field = config.fields.find((f) => f.name === column);
          return field && field.type === "foreign_key";
        });

        const uuidFields = [
          "product_id", "pallet_id", "unit_id", "supplier_id", "customer_id",
          "address_id", "warehouse_id", "distribution_center_id", "route_id", "logistics_supplier_id",
        ];
        const enumFields = [
          "category", "brand", "relationship_level", "variation_theme", "variation_theme_value",
          "packaging_type", "inner_unit_type", "units_of_measurement", "sellable", "active", "currency", "incoterm",
        ];
        const numericFields = config.searchableColumns.filter((column) => {
          const field = config.fields.find((f) => f.name === column);
          return field && field.type === "number";
        });

        if (
          foreignKeySearchColumns.length > 0 ||
          config.searchableColumns.some((column) => uuidFields.includes(column)) ||
          config.searchableColumns.some((column) => enumFields.includes(column)) ||
          numericFields.length > 0
        ) {
          const filteredData = data.filter((record) => {
            return config.searchableColumns.some((column) => {
              const field = config.fields.find((f) => f.name === column);
              if (field && field.type === "foreign_key") {
                const displayValue = record[`${column}_display`];
                return displayValue && displayValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
              } else if (field && field.type === "number") {
                const value = record[column];
                if (value == null) return false;
                const searchNum = parseFloat(searchTerm);
                if (!isNaN(searchNum)) {
                  const numValue = parseFloat(value);
                  return !isNaN(numValue) && (numValue === searchNum || numValue.toString().includes(searchTerm));
                }
                return value.toString().includes(searchTerm);
              } else if (uuidFields.includes(column) || enumFields.includes(column)) {
                const value = record[column];
                return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
              } else {
                const value = record[column];
                return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
              }
            });
          });

          return { data: filteredData, count: filteredData.length };
        } else {
          const filteredData = data.filter((record) => {
            return config.searchableColumns.some((column) => {
              const value = record[column];
              return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
            });
          });

          return { data: filteredData, count: filteredData.length };
        }
      }

      return { data: data || [], count: count || 0 };
    },
    placeholderData: (previousData) => previousData,
  });

  /* -------------------------------
     Real-Time Subscription
  ---------------------------------*/
  useEffect(() => {
    const channel = supabase
      .channel(`${config.table}-changes`)
      .on("postgres_changes", { event: "*", schema: "public", table: config.table }, () => {
        queryClient.invalidateQueries({ queryKey: [config.table] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [config.table, queryClient]);

  /* -------------------------------
     Mutations
  ---------------------------------*/
  const createMutation = useMutation({
    mutationFn: async (newRecord: any) => {
      const validFieldNames = config.fields.map((field) => field.name);
      const filteredRecord = Object.fromEntries(
        Object.entries(newRecord || {}).filter(([k, v]) => validFieldNames.includes(k)),
      );

      const sanitized = Object.fromEntries(
        Object.entries(filteredRecord || {}).map(([k, v]) => 
          [k, v === "" || v === "undefined" || v === undefined || v === "null" ? null : v]
        ),
      );

      const { error } = await (supabase as any).from(config.table).insert([sanitized]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.table] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: `${config.title.slice(0, -1)} created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create ${config.title.slice(0, -1).toLowerCase()}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: any; updates: any }) => {
      const deepSanitize = (obj: any): any => {
        if (obj === null || obj === undefined || obj === "undefined" || obj === "null" || obj === "") {
          return null;
        }
        if (typeof obj === "string" && (obj === "undefined" || obj === "null")) {
          return null;
        }
        if (typeof obj === "object" && obj !== null) {
          return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepSanitize(v)]));
        }
        return obj;
      };

      const sanitized = deepSanitize(updates);

      const potentialUuidFields = [
        "supplier_id", "product_id", "warehouse_id", "customer_id",
        "distribution_center_id", "route_id", "logistics_supplier_id", "unit_id",
      ];
      potentialUuidFields.forEach((field) => {
        if (sanitized.hasOwnProperty(field) && (sanitized[field] === "undefined" || sanitized[field] === undefined)) {
          sanitized[field] = null;
        }
      });

      let query = (supabase as any).from(config.table).update(sanitized);

      if (typeof id === "object" && id !== null) {
        Object.entries(id).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      } else {
        query = query.eq(config.primaryKey, id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.table] });
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      toast({
        title: "Success",
        description: `${config.title.slice(0, -1)} updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update ${config.title.slice(0, -1).toLowerCase()}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: any) => {
      let query = (supabase as any).from(config.table).delete();

      // Handle composite primary keys
      if (typeof id === "object" && id !== null) {
        // Composite primary key - use multiple .eq() calls
        Object.entries(id).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      } else {
        // Single primary key
        query = query.eq(config.primaryKey, id);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.table] });
      toast({
        title: "Success",
        description: `${config.title.slice(0, -1)} deleted successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete ${config.title.slice(0, -1).toLowerCase()}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // -------------------------------
  // Cascading delete helper (UI-managed)
  // -------------------------------
  const dependencyMap: Record<string, { table: string; column: string }[]> = {
    supplier_warehouses: [
      { table: "supplier_products_warehouse", column: "warehouse_id" },
      { table: "routes", column: "warehouse_id" },
    ],
    customer_distribution_centers: [{ table: "routes", column: "distribution_center_id" }],
    suppliers: [
      { table: "supplier_warehouses", column: "supplier_id" },
      { table: "supplier_products", column: "supplier_id" },
      { table: "supplier_products_warehouse", column: "supplier_id" },
    ],
    customers: [{ table: "customer_distribution_centers", column: "customer_id" }],
    products: [
      { table: "supplier_products", column: "product_id" },
      { table: "supplier_products_warehouse", column: "product_id" },
    ],
    routes: [{ table: "route_unit_quotes", column: "route_id" }],
    logistics_cost_suppliers: [{ table: "route_unit_quotes", column: "logistics_supplier_id" }],
    units: [{ table: "route_unit_quotes", column: "unit_id" }],
    address: [
      { table: "customers", column: "address_id" },
      { table: "customer_distribution_centers", column: "address_id" },
      { table: "suppliers", column: "address_id" },
    ],
  };

  const performCascadingDeletes = async (parentTable: string, parentIdColumn: string, id: any) => {
    const dependents = dependencyMap[parentTable] || [];
    for (const dep of dependents) {
      const { error } = await (supabase as any).from(dep.table).delete().eq(dep.column, id);
      if (error) {
        return { ok: false, error };
      }
    }
    return { ok: true };
  };

  /* -------------------------------
     Handlers
  ---------------------------------*/
  const handleCreate = async (formData: any) => {
    // Run custom validation if provided
    if (config.validateBeforeCreate) {
      const validation = await config.validateBeforeCreate(formData);
      if (!validation.valid) {
        toast({
          title: "Validation Error",
          description: validation.error || "Invalid data",
          variant: "destructive",
        });
        return;
      }
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (record: any) => {
    // Clean the record data before editing
    const cleanedRecord = Object.fromEntries(
      Object.entries(record || {}).map(([k, v]) => [
        k,
        v === "undefined" || v === undefined || v === "null" ? null : v,
      ]),
    );
    setEditingRecord(cleanedRecord);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (formData: any) => {
    if (editingRecord) {
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData || {}).map(([k, v]) => 
          [k, v === "" || v === "undefined" || v === undefined || v === "null" ? null : v]
        ),
      );

      let primaryKeyValue;
      if (config.primaryKey.includes(",")) {
        const keyParts = config.primaryKey.split(",").map((k) => k.trim());
        primaryKeyValue = {};
        keyParts.forEach((key) => {
          primaryKeyValue[key] = editingRecord[key];
        });
      } else {
        primaryKeyValue = editingRecord[config.primaryKey];
      }

      updateMutation.mutate({
        id: primaryKeyValue,
        updates: cleanedFormData,
      });
    }
  };

  const handleDelete = async (id: any) => {
    try {
      // Try direct delete first
      let query = (supabase as any).from(config.table).delete();

      // Handle composite primary keys
      if (typeof id === "object" && id !== null) {
        // Composite primary key - use multiple .eq() calls
        Object.entries(id).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      } else {
        // Single primary key
        query = query.eq(config.primaryKey, id);
      }

      const { error: deleteError } = await query;

      if (!deleteError) {
        queryClient.invalidateQueries({ queryKey: [config.table] });
        toast({ title: "Success", description: `${config.title.slice(0, -1)} deleted successfully.` });
        return;
      }

      // If FK violation, remove dependent records from known mapping then retry
      if (deleteError?.code === "23503") {
        const cascade = await performCascadingDeletes(config.table, config.primaryKey, id);
        if (!cascade.ok) throw cascade.error;

        // Retry delete with same composite key handling
        let retryQuery = (supabase as any).from(config.table).delete();

        if (typeof id === "object" && id !== null) {
          Object.entries(id).forEach(([key, value]) => {
            retryQuery = retryQuery.eq(key, value);
          });
        } else {
          retryQuery = retryQuery.eq(config.primaryKey, id);
        }

        const { error: finalDelError } = await retryQuery;

        if (finalDelError) throw finalDelError;

        queryClient.invalidateQueries({ queryKey: [config.table] });
        toast({
          title: "Deleted with dependencies",
          description: `${config.title.slice(0, -1)} and its dependent records were removed.`,
        });
        return;
      }

      // Any other error
      throw deleteError;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete ${config.title.slice(0, -1).toLowerCase()}: ${error?.message || "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  /* -------------------------------
     CSV Export/Import Handlers
  ---------------------------------*/
  const handleCSVExport = async () => {
    try {
      // Fetch all data (without pagination) for export
      const { data: allData, error } = await (supabase as any)
        .from(config.table)
        .select("*");
      
      if (error) throw error;
      
      if (!allData || allData.length === 0) {
        toast({
          title: "No Data",
          description: "There is no data to export.",
          variant: "destructive",
        });
        return;
      }

      // Fetch foreign key data for display
      const foreignKeyFields = config.fields.filter((field) => field.type === "foreign_key");
      
      for (const field of foreignKeyFields) {
        const { data: foreignData, error: foreignError } = await (supabase as any)
          .from(field.foreignTable!)
          .select(`${field.foreignKeyField}, ${field.foreignDisplayField}`);

        if (!foreignError && foreignData) {
          const lookupMap = new Map();
          foreignData.forEach((item: any) => {
            lookupMap.set(item[field.foreignKeyField!], item[field.foreignDisplayField!]);
          });

          allData.forEach((record: any) => {
            const key = record[field.name];
            if (key && lookupMap.has(key)) {
              record[`${field.name}_display`] = lookupMap.get(key);
            }
          });
        }
      }

      // Export fields - include all fields except auto-generated ones
      const primaryKeys = config.primaryKey.split(',').map(k => k.trim());
      
      // Check if data has computed columns (like customer_name, product_name)
      const hasComputedColumns = allData.length > 0 && config.displayColumns.some(col => 
        allData[0].hasOwnProperty(col)
      );
      
      let exportFieldNames;
      if (hasComputedColumns) {
        // Use displayColumns (computed names) but include primary key fields that are foreign keys
        exportFieldNames = config.displayColumns.filter(name => {
          if (primaryKeys.includes(name)) {
            const field = config.fields.find(f => f.name === name);
            return field && field.type === 'foreign_key';
          }
          return true;
        });
      } else {
        // Use field names but include primary key fields that are foreign keys
        exportFieldNames = config.fields
          .map(field => field.name)
          .filter(name => {
            if (primaryKeys.includes(name)) {
              const field = config.fields.find(f => f.name === name);
              return field && field.type === 'foreign_key';
            }
            return true;
          });
      }
      
      const csvContent = convertToCSV(allData, exportFieldNames, config.fields);
      const filename = `${config.table}_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Export Successful",
        description: `Exported ${allData.length} records to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTemplate = () => {
    // For CSV templates, include all fields except auto-generated ones
    const primaryKeys = config.primaryKey.split(',').map(k => k.trim());
    
    // Include all fields, but exclude auto-generated fields like IDs that are not foreign keys
    const exportFieldNames = config.fields
      .map(field => field.name)
      .filter(name => {
        // Include primary key fields that are foreign keys (like supplier_id, product_id)
        if (primaryKeys.includes(name)) {
          const field = config.fields.find(f => f.name === name);
          return field && field.type === 'foreign_key';
        }
        // Include all other fields
        return true;
      });
    
    const template = createCSVTemplate(exportFieldNames, config.fields);
    const filename = `${config.table}_template.csv`;
    downloadCSV(template, filename);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template downloaded successfully",
    });
  };

  const handleCSVFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setCSVFile(file || null);
    setCSVErrors([]);
  };

  const handleCSVImport = async () => {
    if (!csvFile) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    try {
      // Read file content
      const fileContent = await csvFile.text();
      
      // Parse CSV
      const records = parseCSV(fileContent, config.fields);
      
      // Validate data
      const validation = validateCSVData(records, config.fields);
      if (!validation.valid) {
        setCSVErrors(validation.errors);
        return;
      }

      // Resolve foreign key values
      const foreignKeyFields = config.fields.filter((field) => field.type === "foreign_key");
      
      for (const field of foreignKeyFields) {
        // Fetch all foreign key options
        const { data: foreignData, error: foreignError } = await (supabase as any)
          .from(field.foreignTable!)
          .select(`${field.foreignKeyField}, ${field.foreignDisplayField}`);

        if (foreignError) {
          throw new Error(`Failed to fetch ${field.label} options: ${foreignError.message}`);
        }

        // Create lookup map (display value -> key)
        const lookupMap = new Map();
        foreignData?.forEach((item: any) => {
          lookupMap.set(
            item[field.foreignDisplayField!].toLowerCase(),
            item[field.foreignKeyField!]
          );
        });

        // Replace display values with IDs in records
        records.forEach((record, recordIndex) => {
          if (record[field.name]) {
            const displayValue = String(record[field.name]).toLowerCase();
            const id = lookupMap.get(displayValue);
            
            if (id) {
              record[field.name] = id;
            } else {
              // Check if the value is already a valid ID
              const isValidId = foreignData?.some(
                (item: any) => item[field.foreignKeyField!] === record[field.name]
              );
              
              if (!isValidId) {
                // Log available options for debugging
                const availableOptions = foreignData?.map(item => item[field.foreignDisplayField!]).join(', ') || 'none';
                console.warn(`Foreign key lookup failed for ${field.label}: "${record[field.name]}" in record ${recordIndex + 1}. Available options: ${availableOptions}`);
                
                if (field.required) {
                  throw new Error(
                    `Invalid ${field.label} value: "${record[field.name]}" in row ${recordIndex + 2}. Available options: ${availableOptions}`
                  );
                } else {
                  // For non-required fields, set to null if lookup fails
                  console.warn(`Setting ${field.name} to null for non-required field`);
                  record[field.name] = null;
                }
              }
            }
          }
        });
      }

      // Sanitize records
      const sanitizedRecords = records.map((record) => {
        const validFieldNames = config.fields.map((field) => field.name);
        const filteredRecord = Object.fromEntries(
          Object.entries(record).filter(([k]) => validFieldNames.includes(k))
        );
        
        return Object.fromEntries(
          Object.entries(filteredRecord).map(([k, v]) => {
            if (v === "" || v === "undefined" || v === undefined || v === "null") {
              return [k, null];
            }
            return [k, v];
          })
        );
      });

      // Bulk insert
      const { error: insertError } = await (supabase as any)
        .from(config.table)
        .insert(sanitizedRecords);

      if (insertError) {
        throw insertError;
      }

      // Success
      queryClient.invalidateQueries({ queryKey: [config.table] });
      setIsCSVUploadDialogOpen(false);
      setCSVFile(null);
      setCSVErrors([]);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${records.length} records`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV data",
        variant: "destructive",
      });
    }
  };

  /* -------------------------------
     Render Helpers
  ---------------------------------*/
  const renderCellValue = (record: any, column: string) => {
    const value = record[column];

    if (value === null || value === undefined) return "-";

    // Handle foreign key relationships
    const foreignKeyField = config.fields.find((field) => field.name === column && field.type === "foreign_key");
    if (foreignKeyField) {
      // Check for the display value that was added during data fetching
      const displayValue = record[`${column}_display`];
      if (displayValue) {
        return displayValue;
      }

      // Fallback: try to get the display value from joined data
      const relatedData = record[foreignKeyField.foreignTable!];
      if (relatedData && relatedData[foreignKeyField.foreignDisplayField!]) {
        return relatedData[foreignKeyField.foreignDisplayField!];
      }

      return value || "-";
    }

    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>;
    }

    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "...";
    }

    return value.toString();
  };

  /* -------------------------------
     Pagination
  ---------------------------------*/
  const totalPages = data ? Math.ceil(data.count / itemsPerPage) : 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  /* -------------------------------
     Error State
  ---------------------------------*/
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error loading data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* -------------------------------
     Render
  ---------------------------------*/
  return (
    <div className="p-6 space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <config.icon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{config.title}</h1>
          </div>
          <p className="text-muted-foreground mt-1">{config.description}</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* CSV Export Button */}
          <Button variant="outline" onClick={handleCSVExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          {/* CSV Import Dialog */}
          <Dialog open={isCSVUploadDialogOpen} onOpenChange={setIsCSVUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import CSV Data</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to bulk import {config.title.toLowerCase()}. You can download a template to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                
                <FileInput
                  label="Select CSV File"
                  accept=".csv"
                  onChange={handleCSVFileChange}
                  buttonText="Choose CSV File"
                  buttonVariant="outline"
                />

                {csvErrors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-destructive">Validation Errors:</p>
                    <div className="max-h-48 overflow-y-auto border rounded p-2 bg-destructive/10">
                      {csvErrors.map((error, index) => (
                        <p key={`error-${index}`} className="text-sm text-destructive">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsCSVUploadDialogOpen(false);
                    setCSVFile(null);
                    setCSVErrors([]);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleCSVImport} disabled={!csvFile}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-primary-hover">
                <Plus className="h-4 w-4 mr-2" />
                Add {config.title.slice(0, -1)}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New {config.title.slice(0, -1)}</DialogTitle>
              </DialogHeader>
              <CrudForm
                fields={config.fields}
                onSubmit={handleCreate}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createMutation.isPending}
                hasAddressFields={false}
                routeAware={routeAware}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ---------- Search ---------- */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${config.title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* ---------- Table ---------- */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.displayColumns.map((column) => {
                      const field = config.fields.find((f) => f.name === column);
                      const displayName = field
                        ? field.label
                        : column.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                      return (
                        <TableHead key={column} className="font-medium">
                          {displayName}
                        </TableHead>
                      );
                    })}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data?.data.map((record) => {
                    // Generate a unique key for the row
                    let rowKey;
                    if (config.primaryKey.includes(",")) {
                      // Composite primary key - combine all key parts
                      const keyParts = config.primaryKey.split(",").map((k) => k.trim());
                      rowKey = keyParts.map((key) => record[key]).join("-");
                    } else {
                      // Single primary key
                      rowKey = record[config.primaryKey];
                    }

                    return (
                      <TableRow key={rowKey} className="hover:bg-muted/50">
                        {config.displayColumns.map((column, index) => (
                          <TableCell key={`${rowKey}-${column}-${index}`}>{renderCellValue(record, column)}</TableCell>
                        ))}

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Edit */}
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                              <Edit className="h-4 w-4" />
                            </Button>

                            {/* Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete this{" "}
                                    {config.title.slice(0, -1).toLowerCase()}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      // Generate the correct ID for delete
                                      let deleteId;
                                      if (config.primaryKey.includes(",")) {
                                        // Composite primary key - create an object with all key parts
                                        const keyParts = config.primaryKey.split(",").map((k) => k.trim());
                                        deleteId = {};
                                        keyParts.forEach((key) => {
                                          deleteId[key] = record[key];
                                        });
                                      } else {
                                        // Single primary key
                                        deleteId = record[config.primaryKey];
                                      }
                                      handleDelete(deleteId);
                                    }}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* ---------- Pagination ---------- */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, data?.count || 0)} of{" "}
                  {data?.count || 0} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPreviousPage}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">Page</span>
                    <span className="text-sm font-medium">{page}</span>
                    <span className="text-sm">of</span>
                    <span className="text-sm font-medium">{totalPages}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------- Edit Dialog ---------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {config.title.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Update the details for this {config.title.slice(0, -1).toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <CrudForm
              fields={config.fields}
              initialData={editingRecord}
              onSubmit={handleUpdate}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingRecord(null);
              }}
              isLoading={updateMutation.isPending}
              hasAddressFields={false}
              routeAware={routeAware}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
