import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthPage } from "@/components/auth/AuthPage";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import SimplifiedPricing from "./pages/SimplifiedPricing";
import OptimizationInput from "./pages/OptimizationInput";
import QuickQuotation from "./pages/QuickQuotation";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import Warehouses from "./pages/Warehouses";
import DistributionCenters from "./pages/DistributionCenters";
import LogisticsProviders from "./pages/LogisticsProviders";
import RoutesPage from "./pages/RoutesPage";
import Pallets from "./pages/Pallets";
import Units from "./pages/Units";
import SupplierProducts from "./pages/SupplierProducts";
import SupplierProductWarehouse from "./pages/SupplierProductWarehouses";
import RoutesQuotesUnits from "./pages/RoutesQuotesUnits";
import EnumsTables from "./pages/EnumsTables";
import SelfWarehouses from "./pages/SelfWarehouses";
import GeneralPricingRules from "./pages/GeneralPricingRules";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="quotation" element={<QuickQuotation />} />
              <Route path="optimization-input" element={<OptimizationInput />} />
              <Route path="simplified-pricing" element={<SimplifiedPricing />} />
              <Route path="products" element={<Products />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="warehouses" element={<Warehouses />} />
              <Route path="customers" element={<Customers />} />
              <Route path="distribution-centers" element={<DistributionCenters />} />
              <Route path="logistics" element={<LogisticsProviders />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="units" element={<Units />} />
              <Route path="pallets" element={<Pallets />} />
              <Route path="supplier-products" element={<SupplierProducts />} />
              <Route path="supplier-product-warehouses" element={<SupplierProductWarehouse />} />
              <Route path="routes-units" element={<RoutesQuotesUnits />} />
              <Route path="enums-tables" element={<EnumsTables />} />
              <Route path="self-warehouses" element={<SelfWarehouses />} />
              <Route path="general-pricing-rules" element={<GeneralPricingRules />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
