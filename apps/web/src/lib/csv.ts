export const parseCsv = (s: string): string[] =>
  s
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export const joinCsv = (ids: string[]) => ids.join(', ');
