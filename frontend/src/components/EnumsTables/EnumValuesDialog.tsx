import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Plus, Edit, Trash2, Save, X, GripVertical } from 'lucide-react';
import { useEnums } from '../../hooks/useEnums';
import { EnumValue } from '../../types/enums';
import { useToast } from '../../hooks/use-toast';

interface EnumValuesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
}

export const EnumValuesDialog: React.FC<EnumValuesDialogProps> = ({
  isOpen,
  onClose,
  selectedTable
}) => {
  const { enumValues, loading, loadEnumValues, addEnumValue, updateEnumValue, deleteEnumValue, toggleEnumValueStatus } = useEnums();
  const { toast } = useToast();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedTable) {
      loadEnumValues(selectedTable);
    }
  }, [isOpen, selectedTable]);

  const handleAddValue = async () => {
    if (!newValue.trim()) return;
    
    try {
      await addEnumValue(selectedTable, newValue.trim());
      setNewValue('');
      setIsAdding(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEditValue = async () => {
    if (!editingId || !editValue.trim()) return;
    
    try {
      await updateEnumValue(selectedTable, editingId, { value: editValue.trim() });
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeleteValue = async (id: string) => {
    try {
      await deleteEnumValue(selectedTable, id);
      setDeletingId(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleEnumValueStatus(selectedTable, id, !currentStatus);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const startEditing = (value: EnumValue) => {
    setEditingId(value.id);
    setEditValue(value.value);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const getTableDisplayName = () => {
    const tableNames: { [key: string]: string } = {
      'relationship_levels': 'Relationship Levels',
      'variation_themes': 'Variation Themes',
      'brands': 'Brands',
      'categories': 'Categories',
      'variation_theme_values': 'Variation Theme Values',
      'units_of_measurements': 'Units of Measurement',
      'packaging_types': 'Packaging Types',
      'inner_unit_types': 'Inner Unit Types',
      'sellable_options': 'Sellable Options',
      'currencies': 'Currencies',
      'incoterms': 'Incoterms'
    };
    return tableNames[selectedTable] || selectedTable;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Manage {getTableDisplayName()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Value Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Value</CardTitle>
            </CardHeader>
            <CardContent>
              {!isAdding ? (
                <Button onClick={() => setIsAdding(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Value
                </Button>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="newValue">Value</Label>
                    <Input
                      id="newValue"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter new value"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <Button onClick={handleAddValue} disabled={!newValue.trim()}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsAdding(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Values List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Values</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : enumValues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No values found. Add your first value above.
                </div>
              ) : (
                <div className="space-y-3">
                  {enumValues.map((value) => (
                    <div key={value.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        
                        {editingId === value.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-48"
                              onKeyPress={(e) => e.key === 'Enter' && handleEditValue()}
                            />
                            <Button size="sm" onClick={handleEditValue} disabled={!editValue.trim()}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">{value.value}</span>
                        )}
                        
                        <Badge variant={value.is_active ? "default" : "secondary"}>
                          {value.is_active ? "Active" : "Inactive"}
                        </Badge>
                        
                        <span className="text-sm text-muted-foreground">
                          Order: {value.display_order}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={value.is_active}
                          onCheckedChange={() => handleToggleStatus(value.id, value.is_active)}
                        />
                        
                        {editingId !== value.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(value)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background/95 backdrop-blur-sm">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Enum Value</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{value.value}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  setDeletingId(value.id);
                                  handleDeleteValue(value.id);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
