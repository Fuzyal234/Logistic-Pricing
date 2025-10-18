import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, DollarSign, Truck, Package, Building, MapPin, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OptimizationResultsProps {
  results: {
    message: string;
    result: Array<{
      product_id: string;
      combinations: Array<{
        total_cost: number;
        product_cost: number;
        logistics_cost: number;
        supplier_allocations: Array<{
          supplier_id: string;
          warehouse_id: string;
          quantity: number;
          quote_combination: Array<{
            allocated_quantity: number;
            cost: number;
            max_pallets: number;
            route_id: string;
            unit_id: string;
            logistics_supplier_id: string;
          }>;
        }>;
      }>;
    }>;
  };
}

interface EntityNames {
  suppliers: { [key: string]: string };
  warehouses: { [key: string]: string };
  routes: { [key: string]: string };
  units: { [key: string]: string };
  logisticsSuppliers: { [key: string]: string };
  products: { [key: string]: string };
}

const OptimizationResults: React.FC<OptimizationResultsProps> = ({ results }) => {
  const [expandedCombinations, setExpandedCombinations] = useState<Set<string>>(new Set());
  const [entityNames, setEntityNames] = useState<EntityNames>({
    suppliers: {},
    warehouses: {},
    routes: {},
    units: {},
    logisticsSuppliers: {},
    products: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntityNames();
  }, []);

  const fetchEntityNames = async () => {
    try {
      setLoading(true);
      // Fetch all entity names in parallel
      const [suppliersRes, warehousesRes, routesRes, unitsRes, logisticsSuppliersRes, productsRes] = await Promise.all([
        supabase.from("suppliers").select("supplier_id, name"),
        supabase.from("supplier_warehouses").select("warehouse_id, warehouse_name"),
        supabase.from("routes").select("route_id, route_code"),
        supabase.from("units").select("unit_id, unit"),
        supabase.from("logistics_cost_suppliers").select("logistics_supplier_id, name"),
        supabase.from("products").select("product_id, product_name"),
      ]);

      const suppliers: { [key: string]: string } = {};
      const warehouses: { [key: string]: string } = {};
      const routes: { [key: string]: string } = {};
      const units: { [key: string]: string } = {};
      const logisticsSuppliers: { [key: string]: string } = {};
      const products: { [key: string]: string } = {};

      suppliersRes.data?.forEach((s) => (suppliers[s.supplier_id] = s.name || s.supplier_id));
      warehousesRes.data?.forEach((w) => (warehouses[w.warehouse_id] = w.warehouse_name || w.warehouse_id));
      routesRes.data?.forEach((r) => (routes[r.route_id] = r.route_code || r.route_id));
      unitsRes.data?.forEach((u) => (units[u.unit_id] = u.unit || u.unit_id));
      logisticsSuppliersRes.data?.forEach(
        (ls) => (logisticsSuppliers[ls.logistics_supplier_id] = ls.name || ls.logistics_supplier_id),
      );
      productsRes.data?.forEach((p) => (products[p.product_id] = p.product_name || p.product_id));

      console.log("Fetched Entity Names:");
      console.log("Suppliers:", suppliers);
      console.log("Warehouses:", warehouses);
      console.log("Routes:", routes);
      console.log("Units:", units);
      console.log("Logistics Suppliers:", logisticsSuppliers);
      console.log("Products:", products);

      setEntityNames({
        suppliers,
        warehouses,
        routes,
        units,
        logisticsSuppliers,
        products,
      });
    } catch (error) {
      console.error("Error fetching entity names:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCombination = (productId: string, combinationIndex: number) => {
    const key = `${productId}-${combinationIndex}`;
    setExpandedCombinations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getEntityName = (id: string, type: keyof Omit<EntityNames, "products">) => {
    return entityNames[type][id] || id;
  };

  const getProductName = (productId: string) => {
    return entityNames.products[productId] || `Product ${productId}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  // Check if results are empty
  if (!results.result || results.result.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Optimization Results</CardTitle>
            </div>
            <CardDescription className="text-base text-gray-600">{results.message}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Optimization Results</h3>
              <p className="text-gray-600">No optimization results found for the provided details.</p>
              <p className="text-sm text-gray-500 mt-2">Please try adjusting your input parameters and try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Optimization Results</CardTitle>
          </div>
          <CardDescription className="text-base text-gray-600">{results.message}</CardDescription>
        </CardHeader>
      </Card>

      {results.result.map((productResult, productIndex) => {
        const productName = getProductName(productResult.product_id);
        const totalQuantity =
          productResult.combinations[0]?.supplier_allocations.reduce((sum, alloc) => sum + alloc.quantity, 0) || 0;

        return (
          <Card key={productResult.product_id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800">{productName}</CardTitle>
                    <CardDescription className="text-gray-600">Total Quantity: {totalQuantity} units</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2 bg-green-50 text-green-700 border-green-300">
                  Best Price Option
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productResult.combinations
                  .filter((_, combinationIndex) => combinationIndex === 0)
                  .map((combination, combinationIndex) => {
                    const key = `${productResult.product_id}-${combinationIndex}`;
                    const isExpanded = expandedCombinations.has(key);
                    const totalQuantity = combination.supplier_allocations.reduce(
                      (sum, alloc) => sum + alloc.quantity,
                      0,
                    );

                    return (
                      <Card
                        key={combinationIndex}
                        className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary" className="text-base px-3 py-1">
                                Direct Shipment
                              </Badge>
                              {combinationIndex === 0 && <Badge className="bg-green-500 text-white">Best Price</Badge>}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(combination.total_cost)}
                              </div>
                              <div className="text-xs text-gray-500">Total Cost</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                              <DollarSign className="w-5 h-5 text-blue-600" />
                              <div>
                                <div className="text-xs text-gray-600">Product Cost</div>
                                <div className="font-semibold text-blue-600">
                                  {formatCurrency(combination.product_cost)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                              <Truck className="w-5 h-5 text-purple-600" />
                              <div>
                                <div className="text-xs text-gray-600">Logistics Cost</div>
                                <div className="font-semibold text-purple-600">
                                  {formatCurrency(combination.logistics_cost)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
                              <Package className="w-5 h-5 text-emerald-600" />
                              <div>
                                <div className="text-xs text-gray-600">Total Units</div>
                                <div className="font-semibold text-emerald-600">{totalQuantity}</div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <Button
                            variant="outline"
                            onClick={() => toggleCombination(productResult.product_id, combinationIndex)}
                            className="w-full mb-3"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-2" />
                                Hide Supplier Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Show Supplier Details ({combination.supplier_allocations.length} supplier
                                {combination.supplier_allocations.length > 1 ? "s" : ""})
                              </>
                            )}
                          </Button>

                          {isExpanded && (
                            <div className="space-y-4 mt-4">
                              {combination.supplier_allocations.map((allocation, allocIndex) => (
                                <Card
                                  key={allocIndex}
                                  className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200"
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Building className="w-5 h-5 text-blue-500" />
                                        <span className="font-semibold text-gray-800">
                                          {getEntityName(allocation.supplier_id, "suppliers")}
                                        </span>
                                      </div>
                                      <Badge variant="outline" className="bg-white">
                                        {allocation.quantity} units
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                      <Warehouse className="w-4 h-4 text-green-500" />
                                      <span>Warehouse: {getEntityName(allocation.warehouse_id, "warehouses")}</span>
                                    </div>
                                  </CardHeader>

                                  <CardContent>
                                    <div className="space-y-3">
                                      <div className="text-sm font-semibold text-gray-700 mb-2">Logistics Details:</div>
                                      {allocation.quote_combination.map((quote, quoteIndex) => (
                                        <div
                                          key={quoteIndex}
                                          className="bg-white rounded-lg p-4 border border-gray-200"
                                        >
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1">Route</div>
                                              <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-orange-500" />
                                                <span className="text-sm font-medium">
                                                  {getEntityName(quote.route_id, "routes")}
                                                </span>
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1">Logistics Cost</div>
                                              <div className="text-sm font-bold text-green-600">
                                                {formatCurrency(quote.cost)}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1">Unit Type</div>
                                              <div className="text-sm font-medium">
                                                {getEntityName(quote.unit_id, "units")}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1">Logistics Provider</div>
                                              <div className="text-sm font-medium">
                                                {getEntityName(quote.logistics_supplier_id, "logisticsSuppliers")}
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1">
                                                Allocated Pallets Quantity
                                              </div>
                                              <div className="text-sm font-medium">{quote.allocated_quantity}</div>
                                            </div>
                                            <div>
                                              <div className="text-xs text-gray-500 mb-1">Max Pallets</div>
                                              <div className="text-sm font-medium">{quote.max_pallets}</div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default OptimizationResults;
