import type {
  SiaTrafficLight,
} from "../types/sia";


function normalizeDate(
  date: Date
) {
  const result =
    new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}


export function countBusinessDays(
  startDate: Date,
  endDate: Date
): number {
  const start =
    normalizeDate(startDate);

  const end =
    normalizeDate(endDate);

  if (
    start.getTime() ===
    end.getTime()
  ) {
    return 0;
  }

  const direction =
    end.getTime() >
    start.getTime()
      ? 1
      : -1;

  const current =
    new Date(start);

  let businessDays = 0;

  while (
    current.getTime() !==
    end.getTime()
  ) {
    current.setDate(
      current.getDate() +
        direction
    );

    const day =
      current.getDay();

    if (
      day !== 0 &&
      day !== 6
    ) {
      businessDays +=
        direction;
    }
  }

  return businessDays;
}


export function getTrafficLight(
  daysRemaining: number
): SiaTrafficLight {
  if (daysRemaining <= 5) {
    return "ROJO";
  }

  if (daysRemaining <= 10) {
    return "AMARILLO";
  }

  return "VERDE";
}


export function getDeadlineStatus(
  fechaVencimiento: string
) {
  const daysRemaining =
    countBusinessDays(
      new Date(),
      new Date(
        fechaVencimiento
      )
    );

  return {
    daysRemaining,

    overdue:
      daysRemaining < 0,

    trafficLight:
      getTrafficLight(
        daysRemaining
      ),
  };
}


export function formatDate(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(
    new Date(value)
  );
}
