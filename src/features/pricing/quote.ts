import { Temporal } from "@js-temporal/polyfill";
import { Prisma } from "@prisma/client";
export type PriceRule = {
  id: string;
  amountMinor: number;
  priority: number;
  configuration: Prisma.JsonValue;
};
/** Prices every base interval independently so priority and peak windows cannot be bypassed. */
export function quote(input: {
  startsAt: Date;
  endsAt: Date;
  slotMinutes: number;
  timezone: string;
  participants: number;
  mode: string;
  rules: PriceRule[];
}) {
  const duration = input.endsAt.getTime() - input.startsAt.getTime(),
    step = input.slotMinutes * 60000;
  if (duration <= 0 || step <= 0 || duration % step)
    throw new Error("Invalid pricing duration");
  const rules = [...input.rules].sort(
    (a, b) => b.priority - a.priority || a.id.localeCompare(b.id),
  );
  const multiplier = input.mode === "CAPACITY_BASED" ? input.participants : 1;
  const lines: {
    ruleId: string;
    startsAt: string;
    endsAt: string;
    amountMinor: number;
  }[] = [];
  let totalMinor = 0;
  for (
    let tick = input.startsAt.getTime();
    tick < input.endsAt.getTime();
    tick += step
  ) {
    const local = Temporal.Instant.fromEpochMilliseconds(
        tick,
      ).toZonedDateTimeISO(input.timezone),
      minute = local.hour * 60 + local.minute;
    const rule = rules.find((rule) => {
      if (
        !rule.configuration ||
        typeof rule.configuration !== "object" ||
        Array.isArray(rule.configuration)
      )
        return false;
      const c = rule.configuration as Prisma.JsonObject;
      return (
        (!Array.isArray(c.weekdays) ||
          c.weekdays.includes(local.dayOfWeek % 7)) &&
        (typeof c.fromMinute !== "number" || minute >= c.fromMinute) &&
        (typeof c.toMinute !== "number" ||
          minute + input.slotMinutes <= c.toMinute)
      );
    });
    if (!rule) throw new Error("No price is configured for this interval");
    const amountMinor = rule.amountMinor * multiplier;
    totalMinor += amountMinor;
    if (
      !Number.isSafeInteger(totalMinor) ||
      totalMinor < 0 ||
      totalMinor > 2147483647
    )
      throw new Error("Invalid configured price");
    lines.push({
      ruleId: rule.id,
      startsAt: new Date(tick).toISOString(),
      endsAt: new Date(tick + step).toISOString(),
      amountMinor,
    });
  }
  return { totalMinor, multiplier, lines };
}
