import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Users, Factory, ShoppingCart, Zap, Plus, TrendingUp, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Load statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [products, suppliers, customers, pendingOrders] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("suppliers").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("*", { count: "exact", head: true }),
        // Simulated pending orders count
        Promise.resolve({ count: 23 }),
      ]);

      if (products.error) throw products.error;
      if (suppliers.error) throw suppliers.error;
      if (customers.error) throw customers.error;

      return {
        products: products.count || 0,
        suppliers: suppliers.count || 0,
        customers: customers.count || 0,
        pendingOrders: pendingOrders.count || 0,
      };
    },
  });

  const statCards = [
    {
      title: "Products",
      value: stats?.products || 0,
      icon: Package,
      description: "Total products in catalog",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Suppliers",
      value: stats?.suppliers || 0,
      icon: Factory,
      description: "Active suppliers",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Customers",
      value: stats?.customers || 0,
      icon: Users,
      description: "Customer accounts",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders || 0,
      icon: ShoppingCart,
      description: "Orders awaiting processing",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const quickActions = [
    {
      title: "Quick Quotation",
      description: "Generate pricing quotes instantly",
      icon: Zap,
      action: () => navigate("/quotation"),
      variant: "outline" as const,
    },
    {
      title: "Add Product",
      description: "Add new product to catalog",
      icon: Plus,
      action: () => navigate("/products"),
      variant: "outline" as const,
    },
    {
      title: "View Results",
      description: "Check analysis results",
      icon: TrendingUp,
      action: () => navigate("/results"),
      variant: "outline" as const,
    },
    {
      title: "Manage Suppliers",
      description: "Update supplier information",
      icon: Settings,
      action: () => navigate("/suppliers"),
      variant: "outline" as const,
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your logistics pricing management platform</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Commonly used features for efficient workflow management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant={action.variant}
                onClick={action.action}
                className={`h-auto p-4 flex flex-col items-start space-y-2 ${
                  action.highlight ? "ring-2 ring-primary/20 bg-primary-light/20" : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <action.icon className={`h-5 w-5 ${action.highlight ? "text-primary" : ""}`} />
                  <span className={`font-medium ${action.highlight ? "text-primary" : ""}`}>{action.title}</span>
                </div>
                <p className="text-xs text-left text-muted-foreground">{action.description}</p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates and system notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to display</p>
              <p className="text-sm mt-1">Activity will appear here as you use the system</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
