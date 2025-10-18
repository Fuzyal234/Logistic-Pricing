import { FieldConfig } from "@/components/crud/CrudForm";

export function convertToCSV(data: any[], columns: string[], fieldConfigs: FieldConfig[]): string {
  if (!data?.length) return "";

  const fieldMap = new Map(fieldConfigs.map(f => [f.name, f]));
  const headers = columns.map(col => fieldMap.get(col)?.label || col);
  
  const rows = data.map(record => 
    columns.map(col => {
      const field = fieldMap.get(col);
      let value = field?.type === 'foreign_key' && record[`${col}_display`] 
        ? record[`${col}_display`] 
        : record[col];
      
      if (value == null) return '';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      
      const stringValue = String(value);
      return stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')
        ? `"${stringValue.replace(/"/g, '""')}"`
        : stringValue;
    })
  );

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = filename;
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSV(csvContent: string, fieldConfigs: FieldConfig[]): any[] {
  const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }

  const fieldMap = new Map(fieldConfigs.map(f => [f.name, f]));
  const labelMap = new Map(fieldConfigs.map(f => [f.label.toLowerCase(), f.name]));
  const headers = parseCSVLine(lines[0]).map(header => header.trim());
  
  const headerMapping = headers.map(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // First try exact label match
    if (labelMap.has(lowerHeader)) {
      return labelMap.get(lowerHeader);
    }
    
    // Try field name match
    if (fieldMap.has(lowerHeader)) {
      return fieldMap.get(lowerHeader)?.name;
    }
    
        // Try partial matches for common patterns
        for (const field of fieldConfigs) {
          const fieldName = field.name.toLowerCase();
          const fieldLabel = field.label.toLowerCase();
          
          // Check if header contains field name or label
          if (lowerHeader.includes(fieldName) || lowerHeader.includes(fieldLabel)) {
            return field.name;
          }
          
          // Check for common variations
          if (fieldName.includes('customer') && (lowerHeader.includes('customer') || lowerHeader.includes('client'))) {
            return field.name;
          }
          if (fieldName.includes('product') && lowerHeader.includes('product')) {
            return field.name;
          }
          if (fieldName.includes('supplier') && lowerHeader.includes('supplier')) {
            return field.name;
          }
          
          // Route-specific mappings
          if (fieldName === 'warehouse_id' && (lowerHeader.includes('warehouse') || lowerHeader.includes('ware'))) {
            return field.name;
          }
          if (fieldName === 'distribution_center_id' && (lowerHeader.includes('distribution') || lowerHeader.includes('distributio') || lowerHeader.includes('dc'))) {
            return field.name;
          }
          if (fieldName === 'self_warehouse_id' && (lowerHeader.includes('self') || lowerHeader.includes('warehouse'))) {
            return field.name;
          }
          if (fieldName === 'origin_route_id' && (lowerHeader.includes('origin') || lowerHeader.includes('route_regi'))) {
            return field.name;
          }
          if (fieldName === 'destination_route_id' && (lowerHeader.includes('destination') || lowerHeader.includes('dest'))) {
            return field.name;
          }
        }
    
    // Try address field matching
    const addressField = fieldConfigs.find(f => f.name.startsWith('address_') && 
      f.name.replace('address_', '').toLowerCase() === lowerHeader);
    if (addressField) {
      return addressField.name;
    }
    
    // Return original header if no match found
    return header;
  });

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line).map(value => value.trim());
    const record: any = {};
    
    values.forEach((value, index) => {
      const fieldName = headerMapping[index];
      const field = fieldMap.get(fieldName);
      record[fieldName] = value === '' || value === null ? null : 
        field ? convertCSVValue(value, field) : value;
    });
    
    
    return record;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function convertCSVValue(value: string, field: FieldConfig): any {
  const trimmedValue = value.trim();
  
  switch (field.type) {
    case 'number':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? null : num;
      
    case 'toggle':
      const lowerValue = trimmedValue.toLowerCase();
      return lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1';
      
    case 'email':
    case 'tel':
    case 'text':
    case 'textarea':
    case 'select':
    case 'foreign_key':
      return trimmedValue;
      
    default:
      return trimmedValue;
  }
}

export function validateCSVData(records: any[], fieldConfigs: FieldConfig[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  records.forEach((record, index) => {
    const rowNumber = index + 2;
    
    // Check if this is a routes table with route_type field
    const isRoutesTable = fieldConfigs.some(f => f.name === 'route_type');
    const routeType = record.route_type;
    
    fieldConfigs.forEach(field => {
      const value = record[field.name];
      
      // Handle conditional validation for routes table
      let isFieldRequired = field.required;
      if (isRoutesTable && field.conditionalDisplay && routeType) {
        const showWhen = field.conditionalDisplay.showWhen;
        const shouldShow = Array.isArray(showWhen) ? showWhen.includes(routeType) : routeType === showWhen;
        isFieldRequired = field.required && shouldShow;
      }
      
      if (isFieldRequired && !value) {
        errors.push(`Row ${rowNumber}: ${field.label} is required`);
      }
      
      if (field.type === 'email' && value && !emailRegex.test(value)) {
        errors.push(`Row ${rowNumber}: Invalid email format for ${field.label}`);
      }
      
      if (field.type === 'number' && value !== null) {
        if (field.min !== undefined && value < field.min) {
          errors.push(`Row ${rowNumber}: ${field.label} must be at least ${field.min}`);
        }
        if (field.max !== undefined && value > field.max) {
          errors.push(`Row ${rowNumber}: ${field.label} must be at most ${field.max}`);
        }
      }
    });
  });
  
  return { valid: errors.length === 0, errors };
}

export function createCSVTemplate(columns: string[], fieldConfigs: FieldConfig[]): string {
  const fieldMap = new Map(fieldConfigs.map(f => [f.name, f]));
  return columns.map(col => fieldMap.get(col)?.label || col).join(',');
}

