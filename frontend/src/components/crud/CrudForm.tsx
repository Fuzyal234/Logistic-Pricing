import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Upload, ImageIcon } from "lucide-react";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "tel" | "textarea" | "select" | "toggle" | "file" | "foreign_key";
  required?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  options?: string[] | { value: string; label: string }[];
  foreignTable?: string;
  foreignKeyField?: string;
  foreignDisplayField?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  conditionalDisplay?: {
    dependsOn: string;
    showWhen: string | string[];
  };
}

interface CrudFormProps {
  fields: FieldConfig[];
  initialData?: Record<string, any>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  hasAddressFields?: boolean;
  routeAware?: boolean;
  addressJoinMode?: boolean;
}

export function CrudForm({
  fields,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  hasAddressFields = false,
  routeAware = false,
  addressJoinMode = false,
}: CrudFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const addressFields = ["country", "state", "city", "zip", "street"];

  // Create schema
  const createSchema = () => {
    const schemaObject: Record<string, any> = {};
    fields.forEach((field) => {
      let validator: any;
      switch (field.type) {
        case "email":
          validator = z.union([z.string().email(), z.literal(""), z.null()]);
          break;
        case "number":
          validator = z.union([z.coerce.number(), z.literal(""), z.null()]);
          if (field.min !== undefined)
            validator = validator.refine((val) => val === "" || val === null || val >= field.min!);
          if (field.max !== undefined)
            validator = validator.refine((val) => val === "" || val === null || val <= field.max!);
          break;
        case "toggle":
          validator = z.union([z.boolean(), z.literal(""), z.null()]);
          break;
        case "foreign_key":
          // For foreign key fields, ensure they have a valid value when required
          validator = z.union([z.string().min(1, `${field.label} is required`), z.literal(""), z.null()]);
          break;
        default:
          validator = z.union([z.string(), z.literal(""), z.null()]);
      }
      // Make fields optional only in edit mode, not in create mode
      if (!field.required) {
        validator = validator.optional();
      } else if (initialData) {
        // In edit mode, make required fields optional to allow partial updates
        validator = validator.optional();
      }
      schemaObject[field.name] = validator;
    });
    return z.object(schemaObject);
  };

  const schema = createSchema();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? Object.fromEntries(
          Object.entries(initialData).map(([k, v]) => [
            k,
            v === "undefined" || v === undefined || v === "null" ? "" : v,
          ]),
        )
      : {},
  });

  useEffect(() => {
    if (initialData) {
      const cleanedData = Object.fromEntries(
        Object.entries(initialData).map(([k, v]) => [k, v === "undefined" || v === undefined || v === "null" ? "" : v]),
      );
      form.reset(cleanedData);
    }
  }, [initialData, form]);

  // Foreign key queries
  const foreignKeyQueries = fields
    .filter((field) => field.type === "foreign_key")
    .map((field) => ({
      field,
      query: useQuery({
        queryKey: [field.foreignTable],
        queryFn: async () => {
          let query = (supabase as any).from(field.foreignTable!);

          // Special handling for customers table to get both company_name and name
          if (field.foreignTable === "customers") {
            query = query.select(`${field.foreignKeyField}, company_name, name`);
          } else {
            query = query.select(`${field.foreignKeyField}, ${field.foreignDisplayField}`);
          }

          const { data, error } = await query;
          if (error) throw error;
          return data;
        },
        enabled: !!field.foreignTable,
      }),
    }));

  // Enum queries for select fields without hardcoded options
  const enumQueries = fields
    .filter((field) => field.type === "select" && !field.options)
    .map((field) => ({
      field,
      query: useQuery({
        queryKey: [`enum_${field.name}`],
        queryFn: async () => {
          // Get enum values from the database schema
          const { data, error } = await (supabase as any).rpc("get_enum_values", {
            enum_name: field.name,
          });
          if (error) {
            // Fallback to hardcoded values based on field name
            const fallbackValues = {
              brand: [
                "NEW MIX",
                "Maruchan",
                "Barrilito",
                "Bud Light",
                "Corona",
                "Michelob",
                "Modelo",
                "Stella",
                "Victoria",
                "Estrella",
                "Vicky",
                "ZYN",
                "Bacardi",
                "Nuun",
                "Marlboro",
                "Diageo",
                "Nestle",
                "Centenario",
                "Costenia",
                "Herdez",
              ],
              category: ["Alcoholic Beverages", "Tobacco", "Groceries", "Paper", "Energy Drinks"],
              relationship_level: ["Primary", "Secondary"],
              variation_theme: ["Flavor", "Size", "Packaging quantity"],
              variation_theme_value: ["Vampiro", "Paloma", "Original"],
              units_of_measurement: ["ml", "cm", "kg", "L", "dm", "g", "pills"],
              packaging_type: ["Box", "Unit"],
              inner_unit_type: ["Latas", "Botellas", "Cajas", "Tubos", "Piezas"],
              sellable: ["Yes", "No"],
            };
            return fallbackValues[field.name as keyof typeof fallbackValues] || [];
          }
          return data || [];
        },
        enabled: true,
      }),
    }));

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

  // Load warehouse details for route-aware forms
  const loadWarehouseDetails = async (warehouseId: string) => {
    const { data, error } = await supabase
      .from("supplier_warehouses" as any)
      .select(
        `
        *,
        address:address_id (country, state, city, zip, street),
        suppliers:supplier_id (name)
      `,
      )
      .eq("warehouse_id", warehouseId)
      .single();

    if (error) throw error;

    const address = (data as any).address;
    const addressParts = [address?.street, address?.city, address?.state, address?.country, address?.zip].filter(
      Boolean,
    );
    return {
      origin: addressParts.join(", "),
      origin_supplier: (data as any).suppliers?.name || "",
    };
  };

  // Load distribution center details for route-aware forms
  const loadDistributionCenterDetails = async (distributionCenterId: string) => {
    const { data, error } = await supabase
      .from("customer_distribution_centers" as any)
      .select(
        `
        *,
        address:address_id (country, state, city, zip, street),
        customers:customer_id (name)
      `,
      )
      .eq("distribution_center_id", distributionCenterId)
      .single();

    if (error) throw error;

    const address = (data as any).address;
    const addressParts = [address?.street, address?.city, address?.state, address?.country, address?.zip].filter(
      Boolean,
    );
    return {
      destination: addressParts.join(", "),
      destination_customer: (data as any).customers?.name || "",
    };
  };

  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      console.log("Form submission data before processing:", data);

      const toNull = (val: any) => {
        if (val === "" || val === "undefined" || val === undefined || val === "null") return null;
        return val;
      };
      let submissionData = Object.fromEntries(Object.entries({ ...data }).map(([k, v]) => [k, toNull(v)]));

      console.log("Form submission data after processing:", submissionData);

      // Validate required foreign key fields
      const requiredForeignKeyFields = fields.filter((field) => field.type === "foreign_key" && field.required);
      for (const field of requiredForeignKeyFields) {
        const value = submissionData[field.name];
        if (!value || value === "" || value === "undefined" || value === "null") {
          console.error(`Required foreign key field ${field.name} is missing or invalid:`, value);
          throw new Error(`${field.label} is required`);
        }
      }

      const tablesWithAddressId = ["customer_distribution_centers", "suppliers", "customers", "supplier_warehouses"];
      const currentTableFromConfig = fields.find((f) => f.name)?.name; // Try to detect table context

      // Handle address fields - completely skip if hasAddressFields is false
      if (hasAddressFields && addressJoinMode) {
        const addressData: any = {};
        const nonAddressData: any = {};

        Object.keys(submissionData).forEach((key) => {
          if (addressFields.includes(key)) {
            addressData[key] = submissionData[key];
          } else {
            nonAddressData[key] = submissionData[key];
          }
        });

        const hasAddressValues = Object.values(addressData).some((value) => value && value !== "");
        if (hasAddressValues) {
          const addressId = await createAddressRecord(addressData);
          nonAddressData.address_id = addressId;
        }

        submissionData = nonAddressData;
      }

      // Handle route-aware fields
      if (routeAware) {
        const warehouseId = submissionData.warehouse_id;
        const distributionCenterId = submissionData.distribution_center_id;

        if (warehouseId) {
          const warehouseDetails = await loadWarehouseDetails(warehouseId);
          submissionData = { ...submissionData, ...warehouseDetails };
        }

        if (distributionCenterId) {
          const dcDetails = await loadDistributionCenterDetails(distributionCenterId);
          submissionData = { ...submissionData, ...dcDetails };
        }
      }

      onSubmit(submissionData);
    } catch (error: any) {
      console.error("Error handling form submission:", error);
    }
  };

  // Handle file change
  const handleFileChange = (field: FieldConfig, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue(field.name, file.name);
    }
  };

  // Render field
  const renderField = (field: FieldConfig) => {
    if (field.hidden) return null;

    // Handle conditional display
    if (field.conditionalDisplay) {
      const dependentValue = form.watch(field.conditionalDisplay.dependsOn);
      const showWhen = field.conditionalDisplay.showWhen;

      // Handle both string and array values for showWhen
      const shouldShow = Array.isArray(showWhen) ? showWhen.includes(dependentValue) : dependentValue === showWhen;

      if (!shouldShow) {
        return null;
      }
    }

    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel className="flex items-center space-x-1">
              <span>{field.label}</span>
              {field.required && !initialData && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              {field.type === "textarea" ? (
                <Textarea
                  {...formField}
                  placeholder={field.placeholder}
                  disabled={field.readonly || isLoading}
                  rows={3}
                />
              ) : field.type === "select" ? (
                <Select
                  value={formField.value || ""}
                  onValueChange={formField.onChange}
                  disabled={field.readonly || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options
                      ? // Use hardcoded options if provided
                        field.options.map((option) => {
                          const value = typeof option === "string" ? option : option.value;
                          const label = typeof option === "string" ? option : option.label;
                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          );
                        })
                      : // Use enum values from database
                        enumQueries
                          .find((q) => q.field.name === field.name)
                          ?.query.data?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          )) || []}
                  </SelectContent>
                </Select>
              ) : field.type === "foreign_key" ? (
                <Select
                  value={formField.value || ""}
                  onValueChange={formField.onChange}
                  disabled={field.readonly || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {foreignKeyQueries
                      .find((q) => q.field.name === field.name)
                      ?.query.data?.map((item: any) => (
                        <SelectItem key={item[field.foreignKeyField!]} value={item[field.foreignKeyField!]}>
                          {item.company_name || item.name || item[field.foreignDisplayField!]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : field.type === "toggle" ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formField.value === true || formField.value === "true" || formField.value === 1}
                    onCheckedChange={formField.onChange}
                    disabled={field.readonly || isLoading}
                  />
                  <Label className="text-sm text-muted-foreground">
                    {formField.value === true || formField.value === "true" || formField.value === 1
                      ? "Active"
                      : "Inactive"}
                  </Label>
                </div>
              ) : field.type === "file" ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                      disabled={field.readonly || isLoading}
                    />
                    <Button type="button" variant="outline" size="sm" disabled={field.readonly || isLoading}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {imagePreview && (
                    <Card className="p-2 w-fit">
                      <CardContent className="p-2">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Image selected</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Input
                  {...formField}
                  type={field.type}
                  placeholder={field.placeholder}
                  step={field.step}
                  disabled={field.readonly || isLoading}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const regularFields = fields.filter((field) => !addressFields.includes(field.name));
  const addressFormFields = fields.filter((field) => addressFields.includes(field.name));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{regularFields.map(renderField)}</div>
          </CardContent>
        </Card>

        {hasAddressFields && addressFormFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{addressFormFields.map(renderField)}</div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
