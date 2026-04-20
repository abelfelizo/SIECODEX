export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function pct(value: number, digits = 1) {
  return `${round(value, digits)}%`;
}

export function int(value: number) {
  return new Intl.NumberFormat("es-DO").format(Math.round(value));
}

export function compact(value: number) {
  return new Intl.NumberFormat("es-DO", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-DO", {
    dateStyle: "medium"
  }).format(new Date(value));
}
