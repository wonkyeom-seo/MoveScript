import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function groupBy<TItem, TKey extends string | number>(
  items: TItem[],
  keySelector: (item: TItem) => TKey,
) {
  return items.reduce<Record<TKey, TItem[]>>((acc, item) => {
    const key = keySelector(item);
    const bucket = acc[key] ?? [];
    bucket.push(item);
    acc[key] = bucket;
    return acc;
  }, {} as Record<TKey, TItem[]>);
}

export function safeJsonParse<TValue>(value: string | null | undefined, fallback: TValue): TValue {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as TValue;
  } catch {
    return fallback;
  }
}

export function randomToken(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("").slice(0, length);
}
