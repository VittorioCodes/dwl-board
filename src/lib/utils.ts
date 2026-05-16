import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseColors(text: string): string[] {
  const regex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/gi;
  const matches = text.match(regex) || [];
  
  return Array.from(new Set(matches.map(c => {
    if (c.length === 4) {
      return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
    }
    return c;
  }))).map(c => c.toLowerCase());
}

export function getTextColorForBackground(hex: string): string {
  if (!hex || hex.length !== 7) return '#333333';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#111111' : '#ffffff';
}
