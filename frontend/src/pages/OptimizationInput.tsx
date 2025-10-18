import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { APP_CONFIG } from "@/config/app.config";
import { OrderLine, Client, Product } from "@/types/optimization";
import { supabase } from "@/integrations/supabase/client";
import OptimizationResults from "./OptimizationResults";

const OptimizationInput = () => {
  const [formData, setFormData] = useState({
    client_id: "",
    order_lines: [] as OrderLine[],
    selected_distribution_center_id: "",
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributionCenters, setDistributionCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("customers").select("*").order("name");

      if (error) {
        throw error;
      }

      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      });
    }
  };

  const fetchClientDistributionCenters = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_distribution_centers")
        .select(
          `
          *,
          address:address_id (
            street, city, state, country, zip
          )
        `,
        )
        .eq("customer_id", clientId)
        .order("distribution_center_name");

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setDistributionCenters(data);
        const firstDC = data[0];
        setFormData((prev) => ({ ...prev, selected_distribution_center_id: firstDC.distribution_center_id }));
        toast({
          title: "Success",
          description: `Found ${data.length} distribution centers. Default: ${firstDC.distribution_center_name}`,
        });
      } else {
        setDistributionCenters([]);
        setFormData((prev) => ({ ...prev, selected_distribution_center_id: "" }));
        toast({
          title: "Info",
          description: "No distribution centers found for this client.",
        });
      }
    } catch (error) {
      console.error("Error fetching client distribution centers:", error);
      setDistributionCenters([]);
      toast({
        title: "Error",
        description: "Failed to fetch client distribution centers",
        variant: "destructive",
      });
    }
  };

  const handleClientChange = (clientId: string) => {
    setFormData((prev) => ({ ...prev, client_id: clientId }));
    if (clientId) {
      fetchClientDistributionCenters(clientId);
    } else {
      setDistributionCenters([]);
      setFormData((prev) => ({ ...prev, selected_distribution_center_id: "" }));
    }
  };

  const handleDistributionCenterChange = (distributionCenterId: string) => {
    const selectedDC = distributionCenters.find((dc) => dc.distribution_center_id === distributionCenterId);
    if (selectedDC) {
      setFormData((prev) => ({
        ...prev,
        selected_distribution_center_id: distributionCenterId,
      }));
      toast({
        title: "Success",
        description: `Distribution center updated to ${selectedDC.distribution_center_name}`,
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("product_name");

      if (error) {
        throw error;
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  };

  const addOrderLine = () => {
    setFormData({
      ...formData,
      order_lines: [
        ...formData.order_lines,
        {
          product_id: "",
          quantity: 0,
        },
      ],
    });
  };

  const updateOrderLine = <K extends keyof OrderLine>(index: number, field: K, value: OrderLine[K]) => {
    const updated = [...formData.order_lines];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, order_lines: updated });
  };

  const removeOrderLine = (index: number) => {
    setFormData({
      ...formData,
      order_lines: formData.order_lines.filter((_, i) => i !== index),
    });
  };

  const validateForm = () => {
    if (!formData.client_id || formData.order_lines.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a client and add at least one product",
        variant: "destructive",
      });
      return false;
    }

    // Check quantity limits
    const invalidQuantities = formData.order_lines.filter((line) => line.quantity > 50);
    if (invalidQuantities.length > 0) {
      toast({
        title: "Validation Error",
        description: "Quantity cannot exceed 50 for any product",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const runCompleteSourcing = async () => {
    if (!validateForm()) return;
    if (!formData.selected_distribution_center_id) {
      toast({
        title: "Validation Error",
        description: "Please select a distribution center for sourcing optimization",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Transform order lines to the required API format
      const sku_object_list = formData.order_lines.map((line) => ({
        sku_uuid: line.product_id,
        quantity: parseInt(line.quantity.toString()), // Ensure quantity is an integer
      }));

      const payload = {
        sku_object_list: sku_object_list,
        distribution_center_uuid: formData.selected_distribution_center_id,
        hub_location_uuid: "", // Empty string as per the curl example
      };

      const response = await fetch(`${APP_CONFIG.API.BASE_URL}${APP_CONFIG.API.ENDPOINTS.ALGORITHM1_SOURCING}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        console.error("API Error Response:", errorData);
        throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("API Success Response:", data);
      setResults(data);
      toast({
        title: "Success",
        description: "Product sourcing optimization completed successfully",
      });
    } catch (error) {
      console.error("Product sourcing optimization error:", error);
      toast({
        title: "Error",
        description: `Product sourcing optimization failed: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 rounded-2xl"></div>
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                      Product Sourcing
                    </h1>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mt-2"></div>
                  </div>
                </div>
                <p className="text-base text-gray-600 max-w-2xl">
                  Complete sourcing optimization with logistics and pricing calculations for maximum efficiency
                </p>
              </div>
            </div>
          </div>
        </div>

        {!results && (
          <>
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <CardDescription className="text-lg font-semibold text-gray-800">
                    Client & Delivery Setup
                  </CardDescription>
                </div>
                <p className="text-sm text-gray-600">Configure your sourcing parameters to get started</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 group">
                    <Label htmlFor="client" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Client
                    </Label>
                    <Select value={formData.client_id} onValueChange={handleClientChange}>
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 group-hover:border-blue-300">
                        <SelectValue placeholder="Select Client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.customer_id} value={client.customer_id}>
                            {client.name || client.company_name || client.customer_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 group">
                    <Label
                      htmlFor="distribution-center"
                      className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Delivery Center
                    </Label>
                    <Select
                      value={formData.selected_distribution_center_id}
                      onValueChange={handleDistributionCenterChange}
                      disabled={distributionCenters.length === 0}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 group-hover:border-blue-300">
                        <SelectValue
                          placeholder={
                            distributionCenters.length === 0 ? "Select client first" : "Select Distribution Center"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {distributionCenters.map((dc) => (
                          <SelectItem key={dc.distribution_center_id} value={dc.distribution_center_id}>
                            {dc.distribution_center_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {distributionCenters.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-blue-800 font-medium">
                          Found {distributionCenters.length} distribution center
                          {distributionCenters.length > 1 ? "s" : ""} for this client
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Select a distribution center to continue with sourcing optimization.
                        </p>
                        {formData.selected_distribution_center_id && (
                          <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-300">
                            <p className="text-xs text-blue-800 font-medium">
                              Selected:{" "}
                              {
                                distributionCenters.find(
                                  (dc) => dc.distribution_center_id === formData.selected_distribution_center_id,
                                )?.distribution_center_name
                              }
                            </p>
                            {distributionCenters.find(
                              (dc) => dc.distribution_center_id === formData.selected_distribution_center_id,
                            )?.logistics_zone && (
                              <p className="text-xs text-blue-700">
                                Logistics Zone:{" "}
                                {
                                  distributionCenters.find(
                                    (dc) => dc.distribution_center_id === formData.selected_distribution_center_id,
                                  )?.logistics_zone
                                }
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <CardDescription className="text-lg font-semibold text-gray-800">Order Details</CardDescription>
                </div>
                <p className="text-sm text-gray-600">Add products and configure your sourcing requirements</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                        Order Lines
                      </h4>
                      <p className="text-sm text-gray-600">
                        Add the Product Details And Select The Products Combination You Want To Optimize
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={addOrderLine}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </div>
                  </div>

                  {formData.order_lines.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No products added yet. Click "Add Product" to get started.
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white/50 backdrop-blur-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                            <TableHead className="font-semibold text-gray-700 py-4">Product</TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Quantity
                              <span className="text-xs text-gray-500 block">(Max 50)</span>
                            </TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.order_lines.map((line, index) => (
                            <TableRow
                              key={index}
                              className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 border-b border-gray-100"
                            >
                              <TableCell className="py-5">
                                <Select
                                  value={line.product_id}
                                  onValueChange={(value) => updateOrderLine(index, "product_id", value)}
                                >
                                  <SelectTrigger className="border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
                                    <SelectValue placeholder="Select Product" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem key={product.product_id} value={product.product_id}>
                                        {product.product_name || product.sku || product.product_id}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="py-5">
                                <Input
                                  type="number"
                                  min="0"
                                  max="50"
                                  value={line.quantity}
                                  onChange={(e) => updateOrderLine(index, "quantity", parseInt(e.target.value))}
                                  className="border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                                  placeholder="Max 50"
                                />
                              </TableCell>
                              <TableCell className="text-right py-5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOrderLine(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {formData.order_lines.length > 0 && formData.order_lines.some((line) => (line.quantity || 0) > 0) && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={runCompleteSourcing}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      {loading ? "Optimizing..." : "Run Optimization"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {results && <OptimizationResults results={results} />}
      </div>
    </div>
  );
};

export default OptimizationInput;
