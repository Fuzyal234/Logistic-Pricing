import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FieldConfig } from "./CrudForm";

interface AddressAwareCrudFormProps {
  fields: FieldConfig[];
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function AddressAwareCrudForm({
  fields,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AddressAwareCrudFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [addressData, setAddressData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [foreignKeyOptions, setForeignKeyOptions] = useState<Record<string, any[]>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log("AddressAwareCrudForm - initialData:", initialData);
    console.log("AddressAwareCrudForm - fields:", fields);

    // Initialize form data
    const initialFormData: any = {};
    const initialAddressData: any = {};

    fields.forEach((field) => {
      if (field.name?.startsWith("address_")) {
        const addressKey = field.name.replace("address_", "");
        // Check for both prefixed and non-prefixed address fields
        initialAddressData[addressKey] = initialData?.[field.name] || initialData?.[addressKey] || "";
      } else {
        const fieldValue = initialData?.[field.name || ""] || "";
        initialFormData[field.name || ""] = fieldValue;
        console.log(`Setting field ${field.name} to value:`, fieldValue);
      }
    });

    console.log("AddressAwareCrudForm - initialFormData:", initialFormData);
    console.log("AddressAwareCrudForm - initialAddressData:", initialAddressData);

    setFormData(initialFormData);
    setAddressData(initialAddressData);
  }, [fields, initialData]);

  useEffect(() => {
    // Load foreign key options
    const loadForeignKeyOptions = async () => {
      setIsLoadingOptions(true);
      for (const field of fields) {
        if (field.type === "foreign_key" && field.foreignTable) {
          try {
            console.log("Loading foreign key options for:", field.name, field.foreignTable);

            // Build query
            let query = supabase as any;

            // Special handling for customers table to get both company_name and name
            if (field.foreignTable === "customers") {
              query = query.from(field.foreignTable).select(`${field.foreignKeyField || "id"}, company_name, name`);
            } else {
              query = query
                .from(field.foreignTable)
                .select(`${field.foreignKeyField || "id"}, ${field.foreignDisplayField || "name"}`);
            }

            const { data, error } = await query;

            if (error) throw error;

            console.log("Foreign key options loaded for", field.name, ":", data);

            setForeignKeyOptions((prev) => ({
              ...prev,
              [field.name || ""]: data || [],
            }));
          } catch (error) {
            console.error("Error loading foreign key options:", error);
          }
        }
      }
      setIsLoadingOptions(false);
    };

    loadForeignKeyOptions();
  }, [fields, initialData, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required && field.name) {
        const value = field.name.startsWith("address_")
          ? addressData[field.name.replace("address_", "")]
          : formData[field.name];

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

    try {
      // Create address record first if we have address fields
      let addressId = null;
      const hasAddressFields = Object.keys(addressData).length > 0;

      if (hasAddressFields) {
        const { data: address, error: addressError } = await (supabase as any)
          .from("address")
          .insert({
            country: addressData.country || null,
            state: addressData.state || null,
            city: addressData.city || null,
            zip: addressData.zip || null,
            street: addressData.street || null,
          })
          .select()
          .single();

        if (addressError) throw addressError;
        addressId = address.address_id;
      }

      // Prepare final form data
      const finalData = {
        ...formData,
        ...(addressId && { address_id: addressId }),
      };

      onSubmit(finalData);
    } catch (error: any) {
      console.error("Error in form submission:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process form",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (name: string, value: any) => {
    if (name.startsWith("address_")) {
      const addressKey = name.replace("address_", "");
      setAddressData((prev) => ({ ...prev, [addressKey]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const renderField = (field: FieldConfig) => {
    if (!field.name || field.hidden) return null;

    const value = field.name.startsWith("address_")
      ? addressData[field.name.replace("address_", "")]
      : formData[field.name];
    const error = errors[field.name];
    const isDisabled = field.readonly || isSubmitting;

    switch (field.type) {
      case "textarea":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value || ""}
              onChange={(e) => handleInputChange(field.name!, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "select":
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => handleInputChange(field.name!, val)}
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
        console.log("Rendering foreign key field:", field.name, "value:", value, "options:", options);

        // Check if the current value exists in the options
        const selectedOption = options.find(
          (option) => option[field.foreignKeyField || "id"]?.toString() === value?.toString(),
        );

        console.log("Selected option for", field.name, ":", selectedOption);

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              value={value || ""}
              onValueChange={(val) => handleInputChange(field.name!, val)}
              disabled={isDisabled}
            >
              <SelectTrigger className={error ? "border-destructive" : ""}>
                <SelectValue placeholder={`Select ${field.label}`}>
                  {selectedOption
                    ? selectedOption.company_name ||
                      selectedOption.name ||
                      selectedOption[field.foreignDisplayField || "name"]
                    : ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option[field.foreignKeyField || "id"]}
                    value={option[field.foreignKeyField || "id"].toString()}
                  >
                    {option.company_name || option.name || option[field.foreignDisplayField || "name"]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case "toggle":
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={value === true || value === "true" || value === 1}
              onCheckedChange={(checked) => handleInputChange(field.name!, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.name}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
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
              onChange={(e) => handleInputChange(field.name!, e.target.value)}
              placeholder={field.placeholder}
              disabled={isDisabled}
              className={error ? "border-destructive" : ""}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );
    }
  };

  // Separate address fields from regular fields
  const addressFields = fields.filter((field) => field.name?.startsWith("address_"));
  const regularFields = fields.filter((field) => !field.name?.startsWith("address_"));

  // Show loading state while foreign key options are being loaded
  if (isLoadingOptions) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading form options...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Regular Fields */}
      {regularFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{regularFields.map(renderField)}</div>
      )}

      {/* Address Fields */}
      {addressFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{addressFields.map(renderField)}</div>
          </CardContent>
        </Card>
      )}

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
