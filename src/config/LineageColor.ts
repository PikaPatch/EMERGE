const Col = {
  AB: '#0cb2af',
  MS: '#a1c65d',
  E: '#fac723',
  C: '#f29222',
  D: '#e95e50',
  P4: '#936fac',
};

export const LineageColor = Col;

export const LineageColor2 = {
  Za: Col.AB,
  Zpap: Col.E,
  Zpaa: Col.MS,
  Zppa: Col.C,
  Zpppa: Col.D,
  Zpppp: Col.P4,
};

export function LineageColorMap(CellID: string): string{
  for (const lineage of Object.keys(LineageColor2)) {
    if (CellID.startsWith(lineage)) {
      return LineageColor2[lineage];
    }
  }
  return '#808080';
}
