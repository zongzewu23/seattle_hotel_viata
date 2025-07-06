import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to combine and merge Tailwind CSS classes
 * Uses clsx for conditional class handling and tailwind-merge for deduplication
 * @param inputs - Class values to combine
 * @returns Combined and merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
} 