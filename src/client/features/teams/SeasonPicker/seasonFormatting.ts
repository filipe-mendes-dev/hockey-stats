export function seasonFromDate(date: string): string {
  const year = Number(date.slice(0, 4));
  return `${year}/${String(year + 1)
    .slice(-2)
    .padStart(2, "0")}`;
}

export function dateFromSeason(season: string): string | null {
  if (!/^\d{4}\/\d{2}$/.test(season)) return null;
  const date = `${season.slice(0, 4)}-01-01`;
  return Number(season.slice(0, 4)) >= 1000 && seasonFromDate(date) === season
    ? date
    : null;
}
