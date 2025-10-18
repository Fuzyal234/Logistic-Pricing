import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileInput } from "@/components/ui/file-input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { RouteAwareCrudForm } from "./RouteAwareCrudForm";
import { CrudTableConfig } from "./CrudTable";
import { convertToCSV, downloadCSV, parseCSV, validateCSVData, createCSVTemplate } from "@/lib/csvUtils";

interface RouteAwareCrudTableProps {
  config: CrudTableConfig;
}

export function RouteAwareCrudTable({ config }: RouteAwareCrudTableProps) {
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

  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
    setupRealtimeSubscription();
  }, [config.table]);

  const loadData = async () => {
    setLoading(true);
    try {
      let query;

      if (config.table === "route_unit_quotes") {
        // Load route_unit_quotes with joined data including route region
        query = supabase.from(config.table as any).select(`
            *,
            route:route_id (
              route_code
            ),
            routes_by_regions:route_by_region_id (
              value
            ),
            logistics_supplier:logistics_supplier_id (
              name
            ),
            unit:unit_id (
              unit
            )
          `);
      } else if (config.table === "routes") {
        // Load routes with joined warehouse, distribution center, and region data
        query = supabase.from(config.table as any).select(`
            *,
            supplier_warehouses:warehouse_id (
              warehouse_name,
              address:address_id (street, city, state, zip, country),
              suppliers:supplier_id (name)
            ),
            customer_distribution_centers:distribution_center_id (
              distribution_center_name,
              address:address_id (street, city, state, zip, country),
              customers:customer_id (name)
            ),
            routes_by_regions:route_by_region_id (
              value
            ),
            origin_region:origin_route_id (
              value
            ),
            destination_region:destination_route_id (
              value
            )
          `);
      } else {
        // Load other tables with basic joined data (no region fields)
        query = supabase.from(config.table as any).select(`
            *,
            supplier_warehouses:warehouse_id (
              warehouse_name,
              address:address_id (street, city, state, zip, country),
              suppliers:supplier_id (name)
            ),
            customer_distribution_centers:distribution_center_id (
              distribution_center_name,
              address:address_id (street, city, state, zip, country),
              customers:customer_id (name)
            ),
            routes_by_regions:route_by_region_id (
              value
            )
          `);
      }

      let orderQuery = query;

      // Add specific ordering for different tables
      if (config.table === "routes") {
        // Order routes by route_code in descending order (latest first)
        orderQuery = query.order("route_code", { ascending: false });
      } else if (config.table === "route_unit_quotes") {
        // Order route unit quotes by route_id in descending order (latest routes first)
        orderQuery = query.order("route_id", { ascending: false });
      } else {
        // Default ordering by primary key
        orderQuery = query.order(config.primaryKey);
      }

      const { data: result, error } = await orderQuery;

      if (error) throw error;


      setData(result || []);
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
    const channel = supabase
      .channel(`${config.table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: config.table as any,
        },
        () => loadData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        // Update existing item - handle composite primary keys
        let updateQuery = supabase.from(config.table as any).update(formData);

        if (config.primaryKey.includes(",")) {
          const keyParts = config.primaryKey.split(",").map((k) => k.trim());
          keyParts.forEach((key) => {
            const keyValue = editingItem[key];
            if (keyValue === undefined || keyValue === "undefined" || keyValue === null) {
              throw new Error(`Missing primary key value for ${key}`);
            }
            updateQuery = updateQuery.eq(key, keyValue);
          });
        } else {
          const primaryKeyValue = editingItem[config.primaryKey];
          if (primaryKeyValue === undefined || primaryKeyValue === "undefined" || primaryKeyValue === null) {
            throw new Error(`Missing primary key value for ${config.primaryKey}`);
          }
          updateQuery = updateQuery.eq(config.primaryKey, primaryKeyValue);
        }

        const { error } = await updateQuery;

        if (error) throw error;

        toast({
          title: "Updated successfully",
          description: `${config.title.slice(0, -1)} updated successfully`,
        });
      } else {
        let dataToInsert = { ...formData };

        if (config.table === "routes") {
          delete dataToInsert.route_code;

          const { data: existingRoutes, error: countError } = await supabase
            .from("routes")
            .select("route_code")
            .order("route_code", { ascending: false })
            .limit(1);

          if (countError) throw countError;

          let nextNumber = 1;
          if (existingRoutes && existingRoutes.length > 0) {
            const lastRouteCode = existingRoutes[0].route_code;
            if (lastRouteCode && lastRouteCode.startsWith("Route-")) {
              const lastNumber = parseInt(lastRouteCode.replace("Route-", ""), 10);
              if (!isNaN(lastNumber)) {
                nextNumber = lastNumber + 1;
              }
            }
          }

          dataToInsert.route_code = `Route-${nextNumber.toString().padStart(4, "0")}`;
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
    try {
      // Handle composite primary keys
      let deleteQuery = supabase.from(config.table as any).delete();

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

  // Filter data based on search term
  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return config.searchableColumns.some((column) => {
      let value;
      if (column === "warehouse_name") {
        value = item.supplier_warehouses?.warehouse_name;
      } else if (column === "distribution_center_name") {
        value = item.customer_distribution_centers?.distribution_center_name;
      } else if (column === "route_code") {
        value = item.route_code;
      } else {
        value = item[column];
      }

      if (value === null || value === undefined) return false;

      // Check if this is a numeric field
      const field = config.fields.find((f) => f.name === column);
      if (field && field.type === "number") {
        // For numeric fields, handle numeric search properly
        const searchNum = parseFloat(searchTerm);
        if (!isNaN(searchNum)) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            return numValue === searchNum || numValue.toString().includes(searchTerm);
          }
        }
        // Fallback to string search
        return value.toString().includes(searchTerm);
      }

      // For non-numeric fields, do case-insensitive string search
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Paginate filtered data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderCellValue = (value: any, column: string, item: any) => {
    // Handle route_unit_quotes table display
    if (config.table === "route_unit_quotes") {
      if (column === "route_id" && item.route) {
        return item.route.route_code || "-";
      }
      if (column === "logistics_supplier_id" && item.logistics_supplier) {
        return item.logistics_supplier.name || "-";
      }
      if (column === "unit_id" && item.unit) {
        return item.unit.unit || "-";
      }
      if (column === "route_by_region_id") {
        const regionValue = item.routes_by_regions?.value;
        return regionValue || "-";
      }
    }

    // Handle special route columns that need to display related data
    if (column === "warehouse_id" || column === "warehouse_name") {
      const warehouseName = item.supplier_warehouses?.warehouse_name;
      // For region-to-region routes, show the origin region instead
      if (item.route_type === "region_to_region") {
        return item.origin || "Origin Region";
      }
      return warehouseName || "-";
    }

    if (column === "distribution_center_id" || column === "distribution_center_name") {
      const distributionCenterName = item.customer_distribution_centers?.distribution_center_name;
      // For region-to-region routes, show the destination region instead
      if (item.route_type === "region_to_region") {
        return item.destination || "Destination Region";
      }
      return distributionCenterName || "-";
    }

    if (column === "origin_supplier") {
      const supplierName = item.supplier_warehouses?.suppliers?.name;
      return supplierName || "-";
    }

    if (column === "destination_customer") {
      const customerName = item.customer_distribution_centers?.customers?.name;
      return customerName || "-";
    }

    if (column === "route_code") {
      return value || "-";
    }

    // Handle route type display
    if (column === "route_type") {
      if (value === "warehouse_to_dc") {
        return "Warehouse → DC";
      } else if (value === "region_to_region") {
        return "Region → Region";
      }
      return value || "-";
    }

    // Handle route region display
    if (column === "route_region_value") {
      const regionValue = item.routes_by_regions?.value;
      return regionValue || "-";
    }

    if (value === null || value === undefined) return "-";

    // Handle boolean-like values
    if (column.includes("active") || column.includes("sellable") || column.includes("is_")) {
      return (
        <Badge variant={value === "true" || value === true || value === 1 ? "default" : "secondary"}>
          {value === "true" || value === true || value === 1 ? "Yes" : "No"}
        </Badge>
      );
    }

    // Truncate long text
    const stringValue = value.toString();
    if (stringValue.length > 50) {
      return stringValue.substring(0, 50) + "...";
    }

    return stringValue;
  };

  const openEditDialog = (item: any) => {
    setEditingItem({ ...item });
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
      const fileContent = await csvFile.text();
      const records = parseCSV(fileContent, config.fields);
      const validation = validateCSVData(records, config.fields);
      
      if (!validation.valid) {
        setCSVErrors(validation.errors);
        return;
      }

      const foreignKeyFields = config.fields.filter((field) => field.type === "foreign_key");
      
      for (const field of foreignKeyFields) {
        const { data: foreignData, error: foreignError } = await (supabase as any)
          .from(field.foreignTable!)
          .select(`${field.foreignKeyField}, ${field.foreignDisplayField}`);

        if (foreignError) {
          throw new Error(`Failed to fetch ${field.label} options: ${foreignError.message}`);
        }

        const lookupMap = new Map();
        foreignData?.forEach((item: any) => {
          lookupMap.set(
            item[field.foreignDisplayField!].toLowerCase(),
            item[field.foreignKeyField!]
          );
        });

        records.forEach((record, recordIndex) => {
          if (record[field.name]) {
            const displayValue = String(record[field.name]).toLowerCase();
            const id = lookupMap.get(displayValue);
            
            if (id) {
              record[field.name] = id;
            } else {
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

      const { error: insertError } = await (supabase as any)
        .from(config.table)
        .insert(sanitizedRecords);

      if (insertError) {
        throw insertError;
      }

      setIsCSVUploadDialogOpen(false);
      setCSVFile(null);
      setCSVErrors([]);
      loadData();
      
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
                        ? "Update the route information below"
                        : "Fill in the route information below to create a new route"}
                    </DialogDescription>
                  </DialogHeader>
                  <RouteAwareCrudForm
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
                      {config.displayColumns.map((column, index) => {
                        let displayName;
                        // First check if there's a field configuration with a label
                        const field = config.fields.find((f) => f.name === column);
                        if (field && field.label) {
                          displayName = field.label;
                        } else if (column === "warehouse_name") {
                          displayName = "Warehouse";
                        } else if (column === "distribution_center_name") {
                          displayName = "Distribution Center";
                        } else if (column === "route_code") {
                          displayName = "Route Code";
                        } else {
                          displayName = column.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                        }
                        return (
                          <TableHead key={`header-${column}-${index}`} className="font-semibold">
                            {displayName}
                          </TableHead>
                        );
                      })}
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item) => (
                        <TableRow key={item[config.primaryKey]} className="hover:bg-muted/50">
                          {config.displayColumns.map((column, index) => (
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
                                      Are you sure you want to delete this route? This action cannot be undone.
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
                          colSpan={config.displayColumns.length + 1}
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
