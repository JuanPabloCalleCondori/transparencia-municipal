export function addBusinessDays(
  startDate: Date,
  businessDays: number
): Date {
  const result = new Date(startDate);

  let addedDays = 0;

  while (addedDays < businessDays) {
    result.setDate(result.getDate() + 1);

    const day = result.getDay();

    const isWeekend = day === 0 || day === 6;

    if (!isWeekend) {
      addedDays++;
    }
  }

  return result;
}