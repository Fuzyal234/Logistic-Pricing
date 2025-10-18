import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Plus, Search, Edit, Trash2, RefreshCw, Download, Upload, FileDown } from "lucide-react";
import { AddressAwareCrudForm } from "./AddressAwareCrudForm";
import { CrudTableConfig } from "./CrudTable";
import { convertToCSV, downloadCSV, parseCSV, validateCSVData, createCSVTemplate } from "@/lib/csvUtils";

export interface DataIsolationConfig {
  mode: "none" | "user" | "customer-related";
  userIdField?: string;
  customerIdField?: string;
}

interface AddressAwareCrudTableProps {
  config: CrudTableConfig;
  hasAddressFields?: boolean;
  addressJoinConfig?: {
    addressIdField: string;
    displayFields: string[];
  };
  dataIsolation?: DataIsolationConfig;
}

export function AddressAwareCrudTable({
  config,
  hasAddressFields = false,
  addressJoinConfig,
  dataIsolation = { mode: "none" },
}: AddressAwareCrudTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCSVUploadDialogOpen, setIsCSVUploadDialogOpen] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvErrors, setCSVErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const itemsPerPage = 10;
  const requiresAuth = dataIsolation.mode !== "none";

  useEffect(() => {
    if (requiresAuth && !user) {
      setLoading(false);
      return;
    }
    loadData();
    setupRealtimeSubscription();
  }, [config.table, user]);

  const loadData = async () => {
    if (requiresAuth && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to view your data",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let selectFields = "*";

      if (config.table === "supplier_warehouses") {
        selectFields = `*,
          address:address_id (address_id, country, state, city, zip, street),
          suppliers:supplier_id (name)`;
      } else if (config.table === "customer_distribution_centers") {
        selectFields = `*,
          address:address_id (address_id, country, state, city, zip, street),
          customers:customer_id (name)`;
      } else if (config.table === "customer_products") {
        selectFields = `*,
          customers:customer_id (customer_id, name, company_name),
          products:product_id (product_id, product_name),
          currencies:currency_id (id, value),
          incoterms:incoterm_id (id, value)`;
      } else if (hasAddressFields && addressJoinConfig) {
        selectFields = `*,
          address:${addressJoinConfig.addressIdField} (address_id, country, state, city, zip, street)`;
      }

      let result: any[] | null = null;
      let error: any = null;

      if (dataIsolation.mode === "customer-related") {
        const { data: userCustomers, error: customerError } = await supabase
          .from("customers" as any)
          .select("customer_id")
          .eq("user_id", user!.id);

        if (customerError) throw customerError;

        const userCustomerIds = (userCustomers || []).map((c: any) => c.customer_id);

        if (userCustomerIds.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const customerIdField = dataIsolation.customerIdField || "customer_id";
        const res = await supabase
          .from(config.table as any)
          .select(selectFields)
          .in(customerIdField, userCustomerIds)
          .order(config.primaryKey);

        result = res.data as any[] | null;
        error = res.error;
        if (error) throw error;
      } else if (dataIsolation.mode === "user") {
        const userIdField = dataIsolation.userIdField || "user_id";
        const res = await supabase
          .from(config.table as any)
          .select(selectFields)
          .eq(userIdField, user!.id)
          .order(config.primaryKey);

        result = res.data as any[] | null;
        error = res.error;
        if (error) throw error;
      } else {
        try {
          const res = await supabase
            .from(config.table as any)
            .select(selectFields)
            .order(config.primaryKey);
          result = res.data as any[] | null;
          error = res.error;
          if (error) throw error;
        } catch (e: any) {
          const relationshipMissing =
            (e?.code === "PGRST200" || e?.message?.includes("Could not find a relationship")) &&
            config.table === "supplier_warehouses";
          if (!relationshipMissing) throw e;

          const { data: baseRows, error: baseErr } = await supabase
            .from(config.table as any)
            .select(`*,
              address:address_id (address_id, country, state, city, zip, street)`)
            .order(config.primaryKey);
          if (baseErr) throw baseErr;

          const supplierIds = Array.from(new Set((baseRows || []).map((r: any) => r.supplier_id).filter(Boolean)));
          let idToName: Record<string, string> = {};
          if (supplierIds.length > 0) {
            const { data: suppliers, error: supErr } = await supabase
              .from("suppliers" as any)
              .select("supplier_id, name")
              .in("supplier_id", supplierIds);
            if (!supErr) {
              idToName = Object.fromEntries((suppliers || []).map((s: any) => [s.supplier_id, s.name]));
            }
          }

          result = (baseRows || []).map((row: any) => ({
            ...row,
            suppliers: { name: idToName[row.supplier_id] },
          }));
        }
      }

      const transformedData = (result || []).map((item: any) => {
        const transformed = { ...item };

        if (item?.address) {
          Object.assign(transformed, {
            country: item.address.country,
            state: item.address.state,
            city: item.address.city,
            zip: item.address.zip,
            street: item.address.street
          });
        }

        if (item?.suppliers) transformed.supplier_name = item.suppliers.name;
        if (item?.customers) transformed.customer_name = item.customers.company_name || item.customers.name;
        if (item?.products) transformed.product_name = item.products.product_name;
        if (item?.currencies) transformed.currency_name = item.currencies.value;
        if (item?.incoterms) transformed.incoterm_name = item.incoterms.value;

        return transformed;
      });

      setData(transformedData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to load " + config.title.toLowerCase(),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channelName = requiresAuth && user ? `${config.table}-changes-${user.id}` : `${config.table}-changes`;

    const subscriptionConfig: any = {
      event: "*",
      schema: "public",
      table: config.table as any,
    };

    if (dataIsolation.mode === "user" && user) {
      const userIdField = dataIsolation.userIdField || "user_id";
      subscriptionConfig.filter = `${userIdField}=eq.${user.id}`;
    }

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", subscriptionConfig, () => loadData())
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const loadItemForEdit = async (item: any) => {
    if (!hasAddressFields || !addressJoinConfig || !item[addressJoinConfig.addressIdField]) {
      return item;
    }

    try {
      const { data: addressData, error } = await supabase
        .from("address" as any)
        .select("*")
        .eq("address_id", item[addressJoinConfig.addressIdField])
        .single();

      if (error) throw error;

      const address = addressData as any;
      return {
        ...item,
        country: address.country,
        state: address.state,
        city: address.city,
        zip: address.zip,
        street: address.street,
        address_country: address.country,
        address_state: address.state,
        address_city: address.city,
        address_zip: address.zip,
        address_street: address.street,
      };
    } catch (error) {
      console.error("Error loading address data for edit:", error);
      return item;
    }
  };

  const handleSubmit = async (formData: any) => {
    if (requiresAuth && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to perform this action",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizeData = (obj: any) =>
        Object.fromEntries(
          Object.entries(obj || {}).map(([k, v]) => 
            [k, v === "" || v === "undefined" || v === undefined ? null : v]
          )
        );

      if (editingItem) {
        if (dataIsolation.mode === "user") {
          const userIdField = dataIsolation.userIdField || "user_id";
          if (editingItem[userIdField] !== user!.id) {
            toast({
              title: "Access denied",
              description: "You can only edit your own records",
              variant: "destructive",
            });
            return;
          }
        }

        let updateData = sanitizeData({ ...formData });

        if (hasAddressFields && editingItem[addressJoinConfig?.addressIdField || "address_id"]) {
          const addressFields = ["country", "state", "city", "zip", "street"];
          const addressData: any = {};

          addressFields.forEach((field) => {
            if (formData[field] !== undefined) {
              addressData[field] = formData[field];
              delete updateData[field];
            }
          });

          if (Object.keys(addressData).length > 0) {
            const { error: addressError } = await supabase
              .from("address" as any)
              .update(addressData)
              .eq("address_id", editingItem[addressJoinConfig?.addressIdField || "address_id"]);

            if (addressError) throw addressError;
          }
        }

        let updateQuery = supabase
          .from(config.table as any)
          .update(updateData)
          .eq(config.primaryKey, editingItem[config.primaryKey]);

        if (dataIsolation.mode === "user") {
          const userIdField = dataIsolation.userIdField || "user_id";
          updateQuery = updateQuery.eq(userIdField, user!.id);
        }

        const { error } = await updateQuery;
        if (error) throw error;

        toast({
          title: "Updated successfully",
          description: `${config.title.slice(0, -1)} updated successfully`,
        });
      } else {
        let dataToInsert = sanitizeData(formData);

        if (dataIsolation.mode === "user") {
          const userIdField = dataIsolation.userIdField || "user_id";
          dataToInsert = { ...dataToInsert, [userIdField]: user!.id };
        }

        const { error } = await supabase.from(config.table as any).insert(dataToInsert);

        if (error) throw error;

        toast({
          title: "Created successfully",
          description: `New ${config.title.slice(0, -1).toLowerCase()} created successfully`,
        });
      }

      setIsDialogOpen(false);
      setEditingItem(null);
      loadData();
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast({
        title: "Error saving",
        description: error.message || "Failed to save data",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (requiresAuth && !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to perform this action",
        variant: "destructive",
      });
      return;
    }

    if (dataIsolation.mode === "user") {
      const userIdField = dataIsolation.userIdField || "user_id";
      if (item[userIdField] !== user!.id) {
        toast({
          title: "Access denied",
          description: "You can only delete your own records",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      let deleteQuery = supabase.from(config.table as any).delete();

      if (dataIsolation.mode === "user") {
        const userIdField = dataIsolation.userIdField || "user_id";
        deleteQuery = deleteQuery.eq(userIdField, user!.id);
      }

      if (config.primaryKey.includes(",")) {
        const primaryKeys = config.primaryKey.split(",").map((key) => key.trim());
        primaryKeys.forEach((key) => {
          if (item[key]) {
            deleteQuery = deleteQuery.eq(key, item[key]);
          } else {
            throw new Error(`Missing primary key value for ${key}`);
          }
        });
      } else {
        if (!item[config.primaryKey]) {
          throw new Error(`Missing primary key value for ${config.primaryKey}`);
        }
        deleteQuery = deleteQuery.eq(config.primaryKey, item[config.primaryKey]);
      }

      const { error } = await deleteQuery;
      if (error) throw error;

      toast({
        title: "Deleted successfully",
        description: `${config.title.slice(0, -1)} deleted successfully`,
      });

      loadData();
    } catch (error: any) {
      console.error("Error deleting data:", error);
      toast({
        title: "Error deleting",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return config.searchableColumns.some((column) => {
      let value = column.includes(".") 
        ? item[column.split(".")[0]]?.[column.split(".")[1]]
        : item[column];

      if (value == null) return false;

      const field = config.fields.find((f) => f.name === column);
      if (field?.type === "number") {
        const searchNum = parseFloat(searchTerm);
        if (!isNaN(searchNum)) {
          const numValue = parseFloat(value);
          return !isNaN(numValue) && (numValue === searchNum || numValue.toString().includes(searchTerm));
        }
        return value.toString().includes(searchTerm);
      }

      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderCellValue = (value: any, column: string, item: any) => {
    if (value === null || value === undefined) return "-";

    if (column.includes("active") || column.includes("sellable") || column.includes("is_")) {
      return (
        <Badge variant={value === "true" || value === true || value === 1 ? "default" : "secondary"}>
          {value === "true" || value === true || value === 1 ? "Yes" : "No"}
        </Badge>
      );
    }

    const stringValue = value.toString();
    if (stringValue.length > 50) {
      return stringValue.substring(0, 50) + "...";
    }

    return stringValue;
  };

  const openEditDialog = async (item: any) => {
    const itemWithAddress = await loadItemForEdit(item);
    setEditingItem(itemWithAddress);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleCSVExport = async () => {
    try {
      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "There is no data to export.",
          variant: "destructive",
        });
        return;
      }

      // Fetch foreign key data for display values
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

          data.forEach((record: any) => {
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
      const hasComputedColumns = data.length > 0 && config.displayColumns.some(col => 
        data[0].hasOwnProperty(col)
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
      
      const csvContent = convertToCSV(data, exportFieldNames, config.fields);
      const filename = `${config.table}_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Export Successful",
        description: `Exported ${data.length} records to ${filename}`,
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

  // Create address record helper
  const createAddressRecord = async (addressData: any) => {
    const { data, error } = await supabase
      .from("address" as any)
      .insert({
        country: addressData.country || null,
        state: addressData.state || null,
        city: addressData.city || null,
        zip: addressData.zip || null,
        street: addressData.street || null,
      })
      .select("address_id")
      .single();

    if (error) throw error;
    return (data as any).address_id;
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
      
      // Debug: Log the parsed records to see what's happening
      console.log('Parsed CSV records:', records);
      console.log('Field configs:', config.fields);
      
      // Validate data
      const validation = validateCSVData(records, config.fields);
      if (!validation.valid) {
        console.log('Validation errors:', validation.errors);
        setCSVErrors(validation.errors);
        return;
      }

      // Resolve foreign key values
      const foreignKeyFields = config.fields.filter((field) => field.type === "foreign_key");
      
      for (const field of foreignKeyFields) {
        let query = (supabase as any).from(field.foreignTable!);
        
        // Special handling for customers table to get both company_name and name
        if (field.foreignTable === "customers") {
          query = query.select(`${field.foreignKeyField}, company_name, name`);
        } else {
          query = query.select(`${field.foreignKeyField}, ${field.foreignDisplayField}`);
        }

        const { data: foreignData, error: foreignError } = await query;

        if (foreignError) {
          throw new Error(`Failed to fetch ${field.label} options: ${foreignError.message}`);
        }

        const lookupMap = new Map();
        foreignData?.forEach((item: any) => {
          // For customers, check both company_name and name
          if (field.foreignTable === "customers") {
            if (item.company_name) {
              lookupMap.set(item.company_name.toLowerCase(), item[field.foreignKeyField!]);
            }
            if (item.name) {
              lookupMap.set(item.name.toLowerCase(), item[field.foreignKeyField!]);
            }
          } else {
            lookupMap.set(
              item[field.foreignDisplayField!].toLowerCase(),
              item[field.foreignKeyField!]
            );
          }
        });

        records.forEach((record, recordIndex) => {
          if (record[field.name]) {
            const displayValue = String(record[field.name]).toLowerCase().trim();
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
                const availableOptions = foreignData?.map(item => {
                  if (field.foreignTable === "customers") {
                    return item.company_name || item.name;
                  }
                  return item[field.foreignDisplayField!];
                }).filter(Boolean).join(', ') || 'none';
                
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

      // Process records - separate address fields from main table fields
      const processedRecords = [];
      for (const record of records) {
        // Separate address fields from main table fields
        const addressFields = ['address_country', 'address_state', 'address_city', 'address_zip', 'address_street'];
        const addressData: any = {};
        const mainRecordData: any = {};

        Object.entries(record).forEach(([key, value]) => {
          if (addressFields.includes(key)) {
            // Extract the field name without 'address_' prefix
            const addressFieldName = key.replace('address_', '');
            addressData[addressFieldName] = value === "" || value === "undefined" || value === undefined || value === "null" ? null : value;
          } else {
            mainRecordData[key] = value === "" || value === "undefined" || value === undefined || value === "null" ? null : value;
          }
        });

        // Check if we have any address data and addressJoinConfig is provided
        const hasAddressValues = Object.values(addressData).some((value) => value !== null && value !== "");
        
        // Create address record if we have address data and addressJoinConfig exists
        if (hasAddressValues && hasAddressFields && addressJoinConfig) {
          try {
            const addressId = await createAddressRecord(addressData);
            mainRecordData[addressJoinConfig.addressIdField] = addressId;
          } catch (error) {
            console.error("Failed to create address record:", error);
            // Continue without address if creation fails
          }
        }

        // Add user_id for user-based isolation
        if (dataIsolation.mode === "user" && user) {
          const userIdField = dataIsolation.userIdField || "user_id";
          mainRecordData[userIdField] = user.id;
        }

        processedRecords.push(mainRecordData);
      }

      // Bulk insert main records
      const { error: insertError } = await (supabase as any)
        .from(config.table)
        .insert(processedRecords);

      if (insertError) {
        throw insertError;
      }

      // Success
      setIsCSVUploadDialogOpen(false);
      setCSVFile(null);
      setCSVErrors([]);
      loadData();
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${processedRecords.length} records`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV data",
        variant: "destructive",
      });
    }
  };

  const enhancedDisplayColumns = [...config.displayColumns];

  // Show auth required message if needed
  if (requiresAuth && !user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please log in to view your {config.title.toLowerCase()}.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
          {config.icon && <config.icon className="h-8 w-8 text-primary" />}
          <span>{config.title}</span>
        </h1>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      {/* Controls */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Search ${config.title.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              <Button variant="outline" onClick={handleCSVExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              <Dialog open={isCSVUploadDialogOpen} onOpenChange={setIsCSVUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-sm">
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

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="professional" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {config.title.slice(0, -1)}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-sm">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? "Edit" : "Add"} {config.title.slice(0, -1)}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem
                        ? "Update the information below"
                        : "Fill in the information below to create a new item"}
                    </DialogDescription>
                  </DialogHeader>
                  <AddressAwareCrudForm
                    fields={config.fields}
                    initialData={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={() => setIsDialogOpen(false)}
                    isSubmitting={isSubmitting}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="shadow-card bg-gradient-card border-border/50">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      {enhancedDisplayColumns.map((column) => (
                        <TableHead key={column} className="font-semibold">
                          {column.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </TableHead>
                      ))}
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <TableRow key={item[config.primaryKey]} className="hover:bg-muted/50">
                          {enhancedDisplayColumns.map((column, index) => (
                            <TableCell key={`${item[config.primaryKey]}-${column}-${index}`}>{renderCellValue(item[column], column, item)}</TableCell>
                          ))}
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-background/95 backdrop-blur-sm">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete {config.title.slice(0, -1)}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this item? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={enhancedDisplayColumns.length + 1}
                          className="text-center py-12 text-muted-foreground"
                        >
                          {searchTerm
                            ? `No ${config.title.toLowerCase()} found matching "${searchTerm}"`
                            : `No ${config.title.toLowerCase()} found`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} results
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
