export function formatWeight(value: number, unit?: string): string {
  const normalizedUnit = (unit || '').toLowerCase().trim();
  const n = Number(value) || 0;

  const format = (val: number, u: string) => `${Number(val.toFixed(2))} ${u}`;

  switch (normalizedUnit) {
    case 'mg':
      if (n >= 1000) return format(n / 1000, 'g');
      return format(n, 'mg');
    case 'g':
      if (n >= 1000) return format(n / 1000, 'kg');
      return format(n, 'g');
    case 'l':
      return format(n, 'l');
    case 'ml':
      if (n >= 1000) return format(n / 1000, 'l');
      return format(n, 'ml');
    case 'kg':
      if (n < 1) return format(n * 1000, 'g');
      return format(n, 'kg');
    default:
      return `${Number(n.toFixed(2))}${normalizedUnit ? ` ${normalizedUnit}` : ''}`;
  }
}
