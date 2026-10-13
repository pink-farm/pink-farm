import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(priceInPaise: number): string {
  const inRupees = priceInPaise / 100;
  return inRupees % 1 === 0 ? inRupees.toFixed(0) : inRupees.toFixed(2);
}
