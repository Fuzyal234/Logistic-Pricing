import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { FieldConfig } from "./CrudTable";

interface RouteAwareCrudFormProps {
  fields: FieldConfig[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function RouteAwareCrudForm({
  fields,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RouteAwareCrudFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({});
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only initialize form data after foreign key options are loaded
    if (!optionsLoaded) return;

    console.log("Initializing form data with options loaded. Initial data:", initialData);

    // Initialize form data
    const initialFormData: any = {};
    fields.forEach((field) => {
      let value = initialData?.[field.name];

      console.log(`Processing field ${field.name} (${field.type}), initial value:`, value);

      // Handle UUID fields properly - preserve existing values for foreign keys
      if (field.type === "foreign_key") {
        if (value === null || value === undefined) {
          value = "";
        } else {
          // Ensure foreign key values are converted to strings for Select components
          value = value.toString();
        }
        console.log(`Foreign key field ${field.name} set to:`, value);
      } else if (field.name === "route_code" && !initialData) {
        // For new routes, don't initialize route_code - let auto-generation handle it
        value = "";
        console.log(`Route code field ${field.name} left empty for auto-generation`);
      } else if (value === null || value === undefined) {
        value = "";
      }

      initialFormData[field.name] = value;
    });

    // For editing existing routes, determine route type from data
    if (initialData && !initialData.route_type) {
      // If route_type doesn't exist in data, determine it from the populated fields
      if (initialData.warehouse_id && initialData.distribution_center_id) {
        initialFormData.route_type = "warehouse_to_dc";
      } else if (initialData.warehouse_id && initialData.self_warehouse_id) {
        initialFormData.route_type = "warehouse_to_self";
      } else if (initialData.self_warehouse_id && initialData.distribution_center_id) {
        initialFormData.route_type = "self_to_dc";
      } else if (initialData.origin_route_id && initialData.destination_route_id) {
        initialFormData.route_type = "region_to_region";
      }
      // If neither, leave empty so user must choose
    }

    // Auto-calculate total cost if max_pallets and cost_per_pallet are provided
    const maxPallets = parseFloat(initialFormData.max_pallets) || 0;
    const costPerPallet = parseFloat(initialFormData.cost_per_pallet) || 0;
    if (maxPallets > 0 && costPerPallet > 0) {
      initialFormData.cost = maxPallets * costPerPallet;
    }

    console.log("Final form data being set:", initialFormData);
    setFormData(initialFormData);
  }, [fields, initialData, optionsLoaded]);

  // Auto-generate route code for new routes
  useEffect(() => {
    const generateRouteCode = async () => {
      // Only generate for new routes (when initialData is null/undefined) and when route_code field exists
      if (!initialData && fields.some((field) => field.name === "route_code")) {
        try {
          console.log("Generating route code for new route...");
          const { data: existingRoutes, error } = await (supabase as any)
            .from("routes")
            .select("route_code")
            .order("route_code", { ascending: false })
            .limit(1);

          if (!error && existingRoutes) {
            let nextNumber = 1;
            if (existingRoutes.length > 0) {
              const lastRouteCode = existingRoutes[0].route_code;
              console.log("Last route code found:", lastRouteCode);
              if (lastRouteCode && lastRouteCode.startsWith("Route-")) {
                const lastNumber = parseInt(lastRouteCode.replace("Route-", ""), 10);
                if (!isNaN(lastNumber)) {
                  nextNumber = lastNumber + 1;
                }
              }
            }

            const newRouteCode = `Route-${nextNumber.toString().padStart(4, "0")}`;
            console.log("Generated new route code:", newRouteCode);
            setFormData((prev) => ({
              ...prev,
              route_code: newRouteCode,
            }));
          } else if (error) {
            console.error("Error fetching existing routes:", error);
          }
        } catch (error) {
          console.error("Error generating route code:", error);
        }
      }
    };

    // Add a small delay to ensure form is initialized
    const timer = setTimeout(() => {
      generateRouteCode();
    }, 100);

    return () => clearTimeout(timer);
  }, [initialData, fields]);

  // When opening in edit mode, auto-populate readonly helper fields
  useEffect(() => {
    const maybePopulateFromWarehouse = async (warehouseId: string) => {
      try {
        const { data } = await (supabase as any)
          .from("supplier_warehouses")
          .select(
            `
            address:address_id (street, city, state, zip, country),
            suppliers:supplier_id (name)
          `,
          )
          .eq("warehouse_id", warehouseId)
          .single();
        if (data) {
          const addr = (data as any).address;
          setFormData((prev) => ({
            ...prev,
            origin: prev.origin || addr?.street || "",
            origin_supplier: prev.origin_supplier || data.suppliers?.name || "",
          }));
        }
      } catch (e) {
        console.error("Failed to prefill origin fields:", e);
      }
    };

    const maybePopulateFromDC = async (dcId: string) => {
      try {
        const { data } = await (supabase as any)
          .from("customer_distribution_centers")
          .select(
            `
            address:address_id (country, state, city, zip, street),
            customers:customer_id (name)
          `,
          )
          .eq("distribution_center_id", dcId)
          .single();
        if (data) {
          const addr = (data as any).address;
          const destAddress = [addr?.street, addr?.city, addr?.state, addr?.zip, addr?.country]
            .filter(Boolean)
            .join(", ");
          setFormData((prev) => ({
            ...prev,
            destination: prev.destination || destAddress,
            destination_customer: prev.destination_customer || data.customers?.name || "",
          }));
        }
      } catch (e) {
        console.error("Failed to prefill destination fields:", e);
      }
    };

    const whId = (initialData?.warehouse_id ?? formData.warehouse_id) as string | undefined;
    const dcId = (initialData?.distribution_center_id ?? formData.distribution_center_id) as string | undefined;
    if (whId && (!formData.origin || !formData.origin_supplier)) {
      maybePopulateFromWarehouse(whId);
    }
    if (dcId && (!formData.destination || !formData.destination_customer)) {
      maybePopulateFromDC(dcId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, formData.warehouse_id, formData.distribution_center_id]);

  useEffect(() => {
    // Load foreign key options
    const loadForeignKeyOptions = async () => {
      setOptionsLoaded(false);
      const foreignKeyFields = fields.filter((field) => field.type === "foreign_key" && field.foreignTable);

      if (foreignKeyFields.length === 0) {
        setOptionsLoaded(true);
        return;
      }

      const optionsPromises = foreignKeyFields.map(async (field) => {
        try {
          let query = (supabase as any).from(field.foreignTable);

          // Special handling for warehouses and distribution centers to get names
          if (field.foreignTable === "supplier_warehouses") {
            query = query.select(`
              warehouse_id,
              warehouse_name,
              suppliers:supplier_id (name)
            `);
          } else if (field.foreignTable === "customer_distribution_centers") {
            query = query.select(`
              distribution_center_id,
              distribution_center_name,
              customers:customer_id (name)
            `);
          } else if (field.foreignTable === "routes") {
            // Special handling for routes table to get route details
            query = query
              .select(
                `
              route_id,
              route_code,
              warehouse_id,
              distribution_center_id,
              warehouse:warehouse_id (
                warehouse_name,
                address:address_id (street, city, state, zip, country),
                suppliers:supplier_id (name)
              ),
              distribution_center:distribution_center_id (
                distribution_center_name,
                address:address_id (street, city, state, zip, country),
                customers:customer_id (name)
              )
            `,
              )
              .order("route_code", { ascending: false }); // Order by route_code descending (latest first)
          } else {
            const valueField = field.foreignKeyField || "id";
            const labelField = field.foreignDisplayField || "name";
            query = query.select(`${valueField}, ${labelField}`);
          }

          const { data, error } = await query;

          if (error) throw error;

          // Debug logging for options
          console.log(`Foreign key options loaded for ${field.name} (${field.foreignTable}):`, data);

          return { fieldName: field.name, data: data || [] };
        } catch (error) {
          console.error(`Error loading foreign key options for ${field.name}:`, error);
          return { fieldName: field.name, data: [] };
        }
      });

      const results = await Promise.all(optionsPromises);

      const newOptions: Record<string, any[]> = {};
      results.forEach((result) => {
        newOptions[result.fieldName] = result.data;
      });

      setForeignKeyOptions(newOptions);
      setOptionsLoaded(true);
    };

    loadForeignKeyOptions();
  }, [fields]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      // Skip validation for conditionally hidden fields
      if (field.conditionalDisplay) {
        const dependentValue = formData[field.conditionalDisplay.dependsOn];
        const showWhen = field.conditionalDisplay.showWhen;

        // Handle both string and array values for showWhen
        const shouldShow = Array.isArray(showWhen) ? showWhen.includes(dependentValue) : dependentValue === showWhen;

        if (!shouldShow) {
          return; // Skip validation for hidden fields
        }
      }

      if (field.required) {
        const value = formData[field.name];
        if (!value || value.toString().trim() === "") {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the required fields",
        variant: "destructive",
      });
      return;
    }

    // Clean up form data before submitting - only include fields that are defined in the form config
    const cleanedFormData: any = {};

    // Only include fields that are actually defined in the form configuration
    fields.forEach((field) => {
      if (formData.hasOwnProperty(field.name)) {
        let value = formData[field.name];

        // Handle various forms of "undefined" or empty values
        if (value === "" || value === undefined || value === null || value === "undefined" || value === "null") {
          if (field.type === "foreign_key") {
            value = null;
          } else if (field.type === "number") {
            value = null;
          } else {
            value = field.type === "text" ? null : null;
          }
        }

        // Additional safety check for string "undefined"
        if (typeof value === "string" && (value.toLowerCase() === "undefined" || value.toLowerCase() === "null")) {
          value = null;
        }

        cleanedFormData[field.name] = value;
      }
    });

    // Special handling for routes table with route types
    const isRoutesTable = fields.some((field) => field.name === "route_type");

    if (isRoutesTable) {
      // For routes table, handle route type specific logic
      if (cleanedFormData.route_type === "warehouse_to_dc") {
        // For warehouse routes, remove region route fields
        cleanedFormData.origin_route_id = null;
        cleanedFormData.destination_route_id = null;
      } else if (cleanedFormData.route_type === "region_to_region") {
        // For region routes, remove warehouse fields
        cleanedFormData.warehouse_id = null;
        cleanedFormData.distribution_center_id = null;
      }
    }

    // Debug log to check for any remaining "undefined" strings
    console.log("Form submission - cleaned data:", cleanedFormData);
    Object.entries(cleanedFormData).forEach(([key, value]) => {
      if (value === "undefined" || (typeof value === "string" && value.toLowerCase() === "undefined")) {
        console.error(`⚠️  Found "undefined" string in field: ${key} = ${value}`);
      }
    });

    onSubmit(cleanedFormData);
  };

  const handleInputChange = async (key: string, value: any) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [key]: value };

      // Auto-calculate total cost when max_pallets or cost_per_pallet changes
      if (key === "max_pallets" || key === "cost_per_pallet") {
        const maxPallets = key === "max_pallets" ? parseFloat(value) || 0 : parseFloat(updatedData.max_pallets) || 0;
        const costPerPallet =
          key === "cost_per_pallet" ? parseFloat(value) || 0 : parseFloat(updatedData.cost_per_pallet) || 0;

        if (maxPallets > 0 && costPerPallet > 0) {
          updatedData.cost = maxPallets * costPerPallet;
        } else {
          updatedData.cost = "";
        }
      }

      return updatedData;
    });

    // Clear related fields when route type changes
    if (key === "route_type") {
      if (value === "warehouse_to_dc") {
        // Clear region fields, keep warehouse fields
        setFormData((prev) => ({
          ...prev,
          [key]: value,
          origin_route_id: "",
          destination_route_id: "",
          origin: "",
          origin_supplier: "",
          destination: "",
          destination_customer: "",
        }));
      } else if (value === "region_to_region") {
        // Clear warehouse fields, keep region fields
        setFormData((prev) => ({
          ...prev,
          [key]: value,
          warehouse_id: "",
          distribution_center_id: "",
          origin: "",
          origin_supplier: "",
          destination: "",
          destination_customer: "",
        }));
      }
    }

    // Auto-populate origin and destination when route is selected
    if (key === "route_id" && value) {
      try {
        const { data } = await (supabase as any)
          .from("routes")
          .select(
            `
            route_id,
            route_code,
            warehouse_id,
            distribution_center_id,
            warehouse:warehouse_id (
              warehouse_name,
              address:address_id (street, city, state, zip, country),
              suppliers:supplier_id (name)
            ),
            distribution_center:distribution_center_id (
              distribution_center_name,
              address:address_id (street, city, state, zip, country),
              customers:customer_id (name)
            )
          `,
          )
          .eq("route_id", value)
          .single();

        if (data) {
          // Get origin from warehouse address
          const warehouse = data.warehouse;
          const warehouseAddress = warehouse?.address;
          const originAddress = warehouseAddress ? [warehouseAddress.street].filter(Boolean).join(", ") : "";

          // Get destination from distribution center address
          const distributionCenter = data.distribution_center;
          const dcAddress = distributionCenter?.address;
          const destinationAddress = dcAddress ? [dcAddress.street].filter(Boolean).join(", ") : "";

          setFormData((prev) => ({
            ...prev,
            origin: originAddress,
            destination: destinationAddress,
          }));
        }
      } catch (error) {
        console.error("Error loading route details:", error);
      }
    }

    // Auto-populate related fields when warehouse or distribution center is selected
    if (key === "warehouse_id" && value) {
      try {
        const { data } = await (supabase as any)
          .from("supplier_warehouses")
          .select(
            `
            warehouse_name,
            address:address_id (street, city, state, zip, country),
            suppliers:supplier_id (name)
          `,
          )
          .eq("warehouse_id", value)
          .single();

        if (data) {
          const addr = (data as any).address;
          setFormData((prev) => ({
            ...prev,
            origin: addr?.street || "",
            origin_supplier: data.suppliers?.name,
          }));
        }
      } catch (error) {
        console.error("Error loading warehouse details:", error);
      }
    }

    if (key === "distribution_center_id" && value) {
      try {
        const { data } = await (supabase as any)
          .from("customer_distribution_centers")
          .select(
            `
            distribution_center_name,
            address:address_id (street),
            customers:customer_id (name)
          `,
          )
          .eq("distribution_center_id", value)
          .single();

        if (data) {
          const addr = (data as any).address;
          const addressParts = [addr?.street, addr?.city, addr?.state, addr?.zip, addr?.country].filter(Boolean);

          setFormData((prev) => ({
            ...prev,
            destination: addressParts.join(", "),
            destination_customer: data.customers?.name,
          }));
        }
      } catch (error) {
        console.error("Error loading distribution center details:", error);
      }
    }

    // Note: Removed auto-population for origin/destination routes
    // since those fields are hidden for region-to-region routes

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const renderField = (field: FieldConfig) => {
    if (field.hidden) return null;

    // Handle conditional display
    if (field.conditionalDisplay) {
      const dependentValue = formData[field.conditionalDisplay.dependsOn];
      const showWhen = field.conditionalDisplay.showWhen;

      // Handle both string and array values for showWhen
      const shouldShow = Array.isArray(showWhen) ? showWhen.includes(dependentValue) : dependentValue === showWhen;

      if (!shouldShow) {
        return null;
      }
    }

    const value = formData[field.name];
    const error = errors[field.name];
    const isDisabled = field.readonly || isSubmitting;

    switch (field.type) {
      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => handleInputChange(field.name, val)}
              disabled={isDisabled}
            >
              <SelectTrigger className={error ? "border-destructive" : ""}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(field.options) &&
                  field.options.map((option) => {
                    if (typeof option === "string") {
                      return (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      );
                    } else {
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      );
                    }
                  })}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "foreign_key":
        const options = foreignKeyOptions[field.name] || [];
        // Ensure the current value is a string for proper matching with Select options
        const stringValue = value ? value.toString() : "";

        // Debug logging for foreign key matching
        console.log(`Foreign key field ${field.name}:`, {
          currentValue: value,
          stringValue: stringValue,
          optionsCount: options.length,
          options: options.slice(0, 3), // Log first 3 options for debugging
          foreignTable: field.foreignTable,
        });

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={stringValue}
              onValueChange={(val) => handleInputChange(field.name, val)}
              disabled={isDisabled}
            >
              <SelectTrigger className={error ? "border-destructive" : ""}>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => {
                  // Handle different table structures
                  if (field.foreignTable === "supplier_warehouses") {
                    const warehouseName = option.warehouse_name || "Unnamed Warehouse";
                    const optionValue = option.warehouse_id.toString();
                    // Debug log for warehouse options
                    if (field.name === "warehouse_id") {
                      console.log(
                        `Warehouse option: ${optionValue} (${warehouseName}) - matches current: ${optionValue === stringValue}`,
                      );
                    }
                    return (
                      <SelectItem key={option.warehouse_id} value={optionValue}>
                        {warehouseName}
                      </SelectItem>
                    );
                  } else if (field.foreignTable === "customer_distribution_centers") {
                    const distributionCenterName = option.distribution_center_name || "Unnamed Distribution Center";
                    const optionValue = option.distribution_center_id.toString();
                    return (
                      <SelectItem key={option.distribution_center_id} value={optionValue}>
                        {distributionCenterName}
                      </SelectItem>
                    );
                  } else if (field.foreignTable === "self_warehouses") {
                    const warehouseName = option.warehouse_name || "Unnamed Self Warehouse";
                    const optionValue = option.warehouse_id.toString();
                    return (
                      <SelectItem key={option.warehouse_id} value={optionValue}>
                        {warehouseName}
                      </SelectItem>
                    );
                  } else if (field.foreignTable === "routes") {
                    // Handle routes table structure
                    const optionValue = option.route_id.toString();
                    // Debug log for route options
                    if (field.name === "route_id") {
                      console.log(
                        `Route option: ${optionValue} (${option.route_code}) - matches current: ${optionValue === stringValue}`,
                      );
                    }
                    return (
                      <SelectItem key={option.route_id} value={optionValue}>
                        {option.route_code}
                      </SelectItem>
                    );
                  } else {
                    const valueField = field.foreignKeyField || "id";
                    const labelField = field.foreignDisplayField || "name";
                    const optionValue = option[valueField].toString();
                    // Debug log for generic foreign key options
                    if (field.name === "logistics_supplier_id" || field.name === "unit_id") {
                      console.log(
                        `${field.name} option: ${optionValue} (${option[labelField]}) - matches current: ${optionValue === stringValue}`,
                      );
                    }
                    return (
                      <SelectItem key={option[valueField]} value={optionValue}>
                        {option[labelField]}
                      </SelectItem>
                    );
                  }
                })}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              value={value || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.readonly || field.name === "route_code" ? "" : field.placeholder}
              disabled={isDisabled || field.name === "route_code"}
              readOnly={field.readonly || field.name === "route_code"}
              className={`${error ? "border-destructive" : ""} ${field.readonly || field.name === "route_code" ? "bg-muted" : ""}`}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
    }
  };

  if (!optionsLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading form options...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map(renderField)}</div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
