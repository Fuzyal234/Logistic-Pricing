import { useState } from "react";
import {
  LayoutDashboard,
  Zap,
  Package,
  Package2,
  Factory,
  Warehouse,
  Store,
  Users,
  MapPin,
  PackageSearch,
  Truck,
  Ruler,
  Route,
  Network,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
  GripVertical,
  Calculator,
  Building2,
  BarChart3,
  FileText,
  Target,
  Sparkles,
  Brain,
  BarChart,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationGroups = [
  {
    label: "Pricing Tools",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Optimization Input", url: "/optimization-input", icon: Brain },
      { title: "Simplified Pricing", url: "/simplified-pricing", icon: Sparkles },
    ],
  },
  {
    label: "Data Management",
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Pallets", url: "/pallets", icon: Package2 },
      { title: "Suppliers", url: "/suppliers", icon: Factory },
      { title: "Supplier Warehouses", url: "/warehouses", icon: Warehouse },
      { title: "Self Warehouses", url: "/self-warehouses", icon: Building2 },
      { title: "Supplier Product Warehouses", url: "/supplier-product-warehouses", icon: Store },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Customer Distribution Centers", url: "/distribution-centers", icon: MapPin },
      { title: "Client Product Database", url: "/supplier-products", icon: PackageSearch },
      { title: "Logistics Suppliers", url: "/logistics", icon: Truck },
      { title: "Units", url: "/units", icon: Ruler },
      { title: "Routes", url: "/routes", icon: Route },
      { title: "Routes Quotes Units", url: "/routes-units", icon: Network },
      { title: "General Pricing Rules", url: "/general-pricing-rules", icon: Calculator },
      { title: "Enums Tables", url: "/enums-tables", icon: GripVertical },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Results", url: "/results", icon: TrendingUp },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || (path === "/dashboard" && currentPath === "/");

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary font-medium" : "hover:bg-sidebar-accent/50";

  return (
    <Sidebar className="w-64" collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-primary rounded">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold">Logistical Pricing</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={({ isActive }) => `
                          ${getNavCls({ isActive })}
                          ${item.highlight ? "ring-2 ring-primary/20 bg-primary-light/20" : ""}
                          transition-all duration-200 rounded-md
                        `}
                      >
                        <item.icon className={`h-4 w-4 ${item.highlight ? "text-primary" : ""}`} />
                        <span className={item.highlight ? "text-primary font-medium" : ""}>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-2">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
