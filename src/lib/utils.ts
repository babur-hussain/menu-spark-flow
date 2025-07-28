import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting utilities
export const CURRENCY = {
  symbol: '₹',
  code: 'INR',
  name: 'Indian Rupee'
};

export function formatCurrency(amount: number): string {
  return `${CURRENCY.symbol}${amount.toFixed(2)}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 100000) {
    return `${CURRENCY.symbol}${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `${CURRENCY.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}
