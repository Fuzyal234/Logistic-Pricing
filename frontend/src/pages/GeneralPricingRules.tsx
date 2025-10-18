import React, { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import { CrudTable, CrudTableConfig } from "@/components/crud/CrudTable";
import { supabase } from "@/integrations/supabase/client";

export default function GeneralPricingRules() {
  const [ruleNames, setRuleNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingRuleNames();
  }, []);

  const loadExistingRuleNames = async () => {
    try {
      // Get all unique rule names from the database (excluding duplicates)
      const { data, error } = await supabase
        .from("general_pricing_rule")
        .select("rule_name")
        .is("client", null) // Only get default rules (client is null)
        .order("rule_name");

      if (error) {
        console.error("Error loading rule names:", error);
        return;
      }

      // Extract unique rule names
      const uniqueRuleNames = Array.from(new Set(data?.map((item) => item.rule_name).filter(Boolean) || []));

      setRuleNames(uniqueRuleNames);
    } catch (error) {
      console.error("Error loading rule names:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeCreate = async (data: any) => {
    try {
      // Check if this customer already has this rule name
      let query = supabase
        .from("general_pricing_rule")
        .select("id")
        .eq("rule_name", data.rule_name);
      
      // Handle null client (general rules) vs specific client
      if (data.client === null || data.client === undefined || data.client === "") {
        query = query.is("client", null);
      } else {
        query = query.eq("client", data.client);
      }

      const { data: existing, error } = await query.single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "not found" which is what we want
        console.error("Error checking for duplicates:", error);
        return {
          valid: false,
          error: "Error checking for duplicate rules. Please try again.",
        };
      }

      if (existing) {
        const customerText = data.client ? "This customer" : "A general rule";
        return {
          valid: false,
          error: `${customerText} already has a rule with the name "${data.rule_name}". Please edit the existing rule instead.`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error("Error in validation:", error);
      return {
        valid: false,
        error: "Error validating rule. Please try again.",
      };
    }
  };

  const generalPricingRulesConfig: CrudTableConfig = {
    table: "general_pricing_rule",
    title: "General Pricing Rules",
    description:
      "Create general pricing rules that apply to all customers, or customer-specific overrides. Leave customer empty for general rules, or select a customer for specific overrides.",
    primaryKey: "id",
    displayColumns: ["id", "rule_name", "value", "client"],
    searchableColumns: ["rule_name"],
    icon: Calculator,
    validateBeforeCreate,
    fields: [
      {
        name: "rule_name",
        label: "Rule Name",
        type: "select",
        required: true,
        options: loading ? ["Loading..."] : ruleNames,
        placeholder: loading ? "Loading rule names..." : "Select an existing rule name",
      },
      {
        name: "client",
        label: "Customer",
        type: "foreign_key",
        foreignTable: "customers",
        foreignKeyField: "customer_id",
        foreignDisplayField: "company_name",
        placeholder: "Select customer (optional - leave empty for general rules)",
        required: false,
      },
      {
        name: "value",
        label: "Custom Value",
        type: "number",
        placeholder: "Enter custom value for this customer",
        step: 0.01,
        required: true,
      },
    ],
  };

  return <CrudTable config={generalPricingRulesConfig} />;
}
