import { formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatSeconds(value: number) {
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatSecondsLabel(value: number) {
  return `${Number(value.toFixed(2))}초`;
}

export function formatUpdatedAt(value: string) {
  return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
}

export function toNumberLabel(index: number) {
  return String(index + 1).padStart(2, "0");
}
