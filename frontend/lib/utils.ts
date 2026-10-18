import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(value: string | number): string {
  if (!value) return '';
  
  // Remove any non-numeric characters except decimal point
  const numericValue = parseFloat(String(value).replace(/[^\d.]/g, ''));
  
  if (isNaN(numericValue)) return '';
  
  // Format with 2 decimal places
  return numericValue.toFixed(2);
}

export function formatCurrency(value: string | number, prefix: string = 'RM '): string {
  const formatted = formatSalary(value);
  return formatted ? `${prefix}${formatted}` : '';
}

export function formatSalaryRange(rangeString: string): string {
  if (!rangeString) return '';
  
  // Split by common separators
  const parts = rangeString.split(/[-–—]/);
  
  if (parts.length === 2) {
    const minSalary = formatSalary(parts[0]);
    const maxSalary = formatSalary(parts[1]);
    
    if (minSalary && maxSalary) {
      return `RM ${minSalary} - RM ${maxSalary}`;
    }
  }
  
  // If not a range, just format as single salary
  const formatted = formatSalary(rangeString);
  return formatted ? `RM ${formatted}` : '';
}
