import { Prisma } from "@prisma/client";
import { ReservationError } from "../reservations/reservation.service";
export type BillingOptions = { taxBasisPoints?: number; feeMinor?: number };
export async function bill(
  tx: Prisma.TransactionClient,
  input: {
    subtotalMinor: number;
    venueId: string;
    customerId: string;
    couponCode?: string;
  },
  options: BillingOptions,
) {
  const feeMinor = options.feeMinor || 0,
    taxBasisPoints = options.taxBasisPoints || 0;
  if (
    !Number.isInteger(feeMinor) ||
    feeMinor < 0 ||
    !Number.isInteger(taxBasisPoints) ||
    taxBasisPoints < 0 ||
    taxBasisPoints > 10000
  )
    throw new ReservationError(500, "Invalid billing configuration");
  let discountMinor = 0,
    couponId: string | undefined;
  if (input.couponCode) {
    const code = input.couponCode.toUpperCase(),
      now = new Date();
    const rows = await tx.$queryRaw<
      { id: string }[]
    >`SELECT id FROM "Coupon" WHERE code=${code} FOR UPDATE`;
    const coupon =
      rows[0] && (await tx.coupon.findUnique({ where: { id: rows[0].id } }));
    if (
      !coupon ||
      !coupon.isActive ||
      coupon.validFrom > now ||
      coupon.validUntil <= now ||
      (coupon.venueId && coupon.venueId !== input.venueId) ||
      input.subtotalMinor < coupon.minBookingMinor
    )
      throw new ReservationError(409, "Coupon is not valid for this booking");
    const active: Prisma.CouponRedemptionWhereInput = {
      couponId: coupon.id,
      booking: {
        status: { in: ["HELD", "PAYMENT_PENDING", "CONFIRMED", "COMPLETED"] },
      },
    };
    const [used, byUser] = await Promise.all([
      tx.couponRedemption.count({ where: active }),
      tx.couponRedemption.count({
        where: { ...active, userId: input.customerId },
      }),
    ]);
    if (
      (coupon.usageLimit !== null && used >= coupon.usageLimit) ||
      byUser >= coupon.usagePerUser
    )
      throw new ReservationError(409, "Coupon usage limit reached");
    if (coupon.kind === "FIXED_MINOR") discountMinor = coupon.value;
    else if (coupon.kind === "PERCENT_BPS" && coupon.value <= 10000)
      discountMinor = Math.floor((input.subtotalMinor * coupon.value) / 10000);
    else throw new ReservationError(409, "Coupon configuration unavailable");
    discountMinor = Math.max(
      0,
      Math.min(
        discountMinor,
        input.subtotalMinor,
        coupon.maxDiscountMinor ?? input.subtotalMinor,
      ),
    );
    couponId = coupon.id;
  }
  const taxMinor = Math.round(
      ((input.subtotalMinor - discountMinor) * taxBasisPoints) / 10000,
    ),
    totalMinor = input.subtotalMinor - discountMinor + taxMinor + feeMinor;
  if (
    !Number.isSafeInteger(totalMinor) ||
    totalMinor < 0 ||
    totalMinor > 2147483647
  )
    throw new ReservationError(
      409,
      "Booking total is outside supported limits",
    );
  return {
    subtotalMinor: input.subtotalMinor,
    feeMinor,
    taxMinor,
    discountMinor,
    totalMinor,
    couponId,
    taxBasisPoints,
  };
}
