export function positiveNumber(value: string): boolean {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export function positiveInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0;
}
