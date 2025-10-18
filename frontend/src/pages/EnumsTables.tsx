import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  GripVertical, 
  Search, 
  Settings, 
  Database, 
  Tag, 
  Package, 
  Truck, 
  Users, 
  MapPin, 
  DollarSign, 
  Globe,
  Plus,
  Route
} from 'lucide-react';
import { useEnums } from '../hooks/useEnums';
import { EnumValuesDialog } from '../components/EnumsTables/EnumValuesDialog';
import { EnumTable } from '../types/enums';

export default function EnumsTables() {
  const { enumTables } = useEnums();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredTables = enumTables.filter(table =>
    table.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setIsDialogOpen(true);
  };

  const getTableIcon = (tableName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'relationship_levels': <Tag className="h-6 w-6" />,
      'variation_themes': <Package className="h-6 w-6" />,
      'brands': <Tag className="h-6 w-6" />,
      'categories': <Package className="h-6 w-6" />,
      'variation_theme_values': <Package className="h-6 w-6" />,
      'units_of_measurements': <GripVertical className="h-6 w-6" />,
      'packaging_types': <Package className="h-6 w-6" />,
      'inner_unit_types': <Package className="h-6 w-6" />,
      'sellable_options': <Tag className="h-6 w-6" />,
      'currencies': <DollarSign className="h-6 w-6" />,
      'incoterms': <Globe className="h-6 w-6" />,
      'location_origins': <MapPin className="h-6 w-6" />,
      'routes_by_regions': <Route className="h-6 w-6" />
    };
    return iconMap[tableName] || <Database className="h-6 w-6" />;
  };

  const getTableColor = (tableName: string) => {
    const colorMap: { [key: string]: string } = {
      'relationship_levels': 'bg-blue-100 text-blue-800',
      'variation_themes': 'bg-green-100 text-green-800',
      'brands': 'bg-purple-100 text-purple-800',
      'categories': 'bg-orange-100 text-orange-800',
      'variation_theme_values': 'bg-teal-100 text-teal-800',
      'units_of_measurements': 'bg-indigo-100 text-indigo-800',
      'packaging_types': 'bg-pink-100 text-pink-800',
      'inner_unit_types': 'bg-yellow-100 text-yellow-800',
      'sellable_options': 'bg-red-100 text-red-800',
      'currencies': 'bg-emerald-100 text-emerald-800',
      'incoterms': 'bg-cyan-100 text-cyan-800',
      'location_origins': 'bg-amber-100 text-amber-800',
      'routes_by_regions': 'bg-violet-100 text-violet-800'
    };
    return colorMap[tableName] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Enum Tables Management</h1>
          <p className="text-muted-foreground">
            Manage dropdown values and enum options used throughout the system
          </p>
        </div>
       
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Enum Tables</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                All Tables ({enumTables.length})
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-secondary">
                Active Only
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enum Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTables.map((table) => (
          <Card 
            key={table.table_name} 
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => handleTableSelect(table.table_name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${getTableColor(table.table_name)}`}>
                  {getTableIcon(table.table_name)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle className="text-lg">{table.display_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {table.description}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Table:</span>
                <code className="bg-secondary px-2 py-1 rounded text-xs">
                  {table.table_name}
                </code>
              </div>
              <div className="mt-3 pt-3 border-t">
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  Manage Values
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTables.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No enum tables found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? `No tables match "${searchTerm}"` : 'No enum tables are configured yet.'}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">About Enum Tables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Enum tables store the dropdown values used throughout the system. These values are linked to main tables 
            via foreign keys, allowing you to dynamically manage options without changing the database schema.
          </p>
          <p>
            <strong>Key Benefits:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Add new dropdown options without code changes</li>
            <li>Maintain data consistency across the system</li>
            <li>Enable/disable specific options as needed</li>
            <li>Reorder values to control display order</li>
          </ul>
        </CardContent>
      </Card>

      {/* Enum Values Dialog */}
      <EnumValuesDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        selectedTable={selectedTable}
      />
    </div>
  );
}
