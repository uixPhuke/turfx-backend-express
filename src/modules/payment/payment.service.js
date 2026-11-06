const crypto = require("crypto");
const { signaturesMatch, requireBookingOwner, verifyOrderBinding } = require("../../utils/paymentIntegrity");
const Razorpay = require("razorpay");
const slotService = require("../slot/slot.service");

const Payment = require("./payment.model");
const Booking = require("../booking/booking.model");

const ApiError = require("../../utils/ApiError");

// ==========================================
// Razorpay Instance
// ==========================================

let razorpay;
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, "Payment provider is not configured");
  }
  if (!razorpay) razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET });
  return razorpay;
};
// ==========================================
// Generate Receipt
// Example:
// RCPT-20260724-0001
// ==========================================

const generateReceipt = async () => {

  const today = new Date();

  const date =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const count =
    await Payment.countDocuments({
      createdAt: {
        $gte: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        ),
      },
    });

  return `RCPT-${date}-${String(
    count + 1
  ).padStart(4, "0")}`;

};

// ==========================================
// Convert Amount
// Razorpay expects amount in paise
// ==========================================

const toPaise = (amount) => {

  return Math.round(
    Number(amount) * 100
  );

};

// ==========================================
// Create Payment Order
// ==========================================

const createPaymentOrder = async (
  bookingId,
  paymentMethod = "razorpay",
  actorId
) => {

  // ========================================
  // Booking
  // ========================================

  const booking =
    await Booking.findById(bookingId)
      .populate("user")
      .populate("owner")
      .populate("turf");

  if (!booking) {
    throw new ApiError(
      404,
      "Booking not found"
    );
  }

  requireBookingOwner(booking, actorId);

  if (
    booking.bookingStatus !==
    "pending"
  ) {
    throw new ApiError(
      400,
      "Booking is not eligible for payment"
    );
  }

  // ========================================
  // Duplicate Payment
  // ========================================

  const existingPayment =
    await Payment.findOne({
      booking: booking._id,
      isDeleted: false,
    });

  if (existingPayment) {
    throw new ApiError(
      409,
      "Payment already exists for this booking"
    );
  }

  // ========================================
  // Receipt
  // ========================================

  const receipt =
    await generateReceipt();

  // ========================================
  // Razorpay Order Payload
  // ========================================

  const orderPayload = {

    amount: toPaise(
      booking.pricing.totalAmount
    ),

    currency: "INR",

    receipt,

    payment_capture: 1,

    notes: {

      bookingId:
        booking._id.toString(),

      bookingNumber:
        booking.bookingNumber,

      turf:
        booking.turf.name,

      user:
        booking.user.name,

    },

  };
    // ========================================
  // Create Razorpay Order
  // ========================================

  const razorpayOrder =
    await getRazorpay().orders.create(
      orderPayload
    );

  if (!razorpayOrder) {
    throw new ApiError(
      500,
      "Unable to create Razorpay order"
    );
  }

  // ========================================
  // Create Payment Record
  // ========================================

  const payment =
    await Payment.create({

      booking: booking._id,

      bookingNumber:
        booking.bookingNumber,

      user: booking.user._id,

      owner: booking.owner._id,

      turf: booking.turf._id,

      amount: {
        subtotal:
          booking.pricing.slotPrice,

        convenienceFee:
          booking.pricing.convenienceFee,

        tax:
          booking.pricing.tax,

        discount:
          booking.pricing.discount,

        total:
          booking.pricing.totalAmount,

        currency: "INR",
      },

      paymentMethod,

      razorpay: {
        orderId:
          razorpayOrder.id,
      },

      status: "pending",

      expiresAt:
        new Date(
          Date.now() +
          15 * 60 * 1000
        ), // 15 minutes

    });

  // ========================================
  // Update Booking
  // ========================================

  booking.payment.orderId =
    razorpayOrder.id;

  booking.payment.status =
    "pending";

  await booking.save();

  // ========================================
  // Response
  // ========================================

  return {

    payment,

    razorpayOrder: {

      id:
        razorpayOrder.id,

      amount:
        razorpayOrder.amount,

      currency:
        razorpayOrder.currency,

      receipt:
        razorpayOrder.receipt,

      key:
        process.env
          .RAZORPAY_KEY_ID,

    },

  };

};

// ==========================================
// Verify Payment
// ==========================================

const verifyPayment = async (data, actorId) => {
  const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId,
    razorpay_signature: signature } = data;
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found");
  requireBookingOwner(booking, actorId);
  const payment = await Payment.findOne({ booking: booking._id, isDeleted: false });
  if (!payment) throw new ApiError(404, "Payment not found");
  verifyOrderBinding(booking, payment, orderId);
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`).digest("hex");
  if (!signaturesMatch(expected, signature)) throw new ApiError(400, "Invalid payment signature");
  if (payment.status === "paid" && booking.bookingStatus === "confirmed" &&
      payment.razorpay.paymentId === paymentId) return { payment, booking };
  if (booking.bookingStatus !== "pending" ||
      (payment.expiresAt && payment.expiresAt <= new Date())) {
    throw new ApiError(409, "Booking hold is no longer payable");
  }
  const captured = await getRazorpay().payments.fetch(paymentId);
  if (captured.order_id !== orderId || captured.status !== "captured" ||
      captured.amount !== toPaise(booking.pricing.totalAmount) || captured.currency !== "INR") {
    throw new ApiError(409, "Gateway payment does not match the booking amount or capture status");
  }
  payment.razorpay.paymentId = paymentId;
  payment.razorpay.signature = signature;
  payment.status = "paid";
  payment.paidAt = new Date();
  await payment.save();
  booking.payment.paymentId = paymentId;
  booking.payment.signature = signature;
  booking.payment.status = "paid";
  booking.payment.paidAt = payment.paidAt;
  booking.bookingStatus = "confirmed";
  await booking.save();
  return { payment, booking };
};

// ==========================================
// Refund Payment
// ==========================================

const refundPayment = async (
  paymentId,
  reason = "Customer requested refund"
) => {

  let payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found"
    );
  }

  if (payment.status !== "paid") {
    throw new ApiError(
      400,
      "Only successful payments can be refunded"
    );
  }

  // Persist intent before contacting the provider. Never claim settlement from a local flag.
  if (payment.refund.status === "pending") return payment;
  payment = await Payment.findOneAndUpdate({ _id: paymentId, status: "paid",
    "refund.status": { $nin: ["pending", "processed"] } },
    { $set: { refund: { amount: payment.amount.total, reason, status: "pending" } } }, { new: true });
  if (!payment) throw new ApiError(409, "Refund is already in progress");
  let refund;
  try {
    refund = await getRazorpay().payments.refund(payment.razorpay.paymentId, {
      amount: toPaise(payment.amount.total), notes: { reason },
      receipt: `refund-${payment._id}`,
    });
  } catch (error) {
    // Keep pending: an ambiguous network failure may have created a refund upstream.
    throw new ApiError(502, "Refund confirmation is pending; reconcile with the payment provider");
  }
  payment.refund.refundId = refund.id;
  payment.refund.status = refund.status === "processed" ? "processed" : "pending";
  if (payment.refund.status === "processed") {
    payment.refund.refundedAt = new Date();
    payment.status = "refunded";
  }
  await payment.save();
  return payment;

};

// ==========================================
// Cancel Payment
// ==========================================

const cancelPayment = async (
  paymentId
) => {

  const payment = await Payment.findById(
    paymentId
  );

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found"
    );
  }

  if (
    payment.status === "paid"
  ) {
    throw new ApiError(
      400,
      "Paid payment cannot be cancelled"
    );
  }

  payment.status = "cancelled";

  await payment.save();

  // ========================================
  // Update Booking
  // ========================================

  const booking =
    await Booking.findById(
      payment.booking
    );

  if (booking) {

    booking.bookingStatus =
      "cancelled";

    booking.payment.status =
      "failed";

    await booking.save();

    if (booking.slot) {
      await slotService.releaseSlot(
        booking.slot
      );
    }

  }

  return payment;

};
// ==========================================
// Handle Razorpay Webhook
// ==========================================

const handleWebhook = async (
  signature,
  payload,
  rawBody
) => {

  // ========================================
  // Verify Webhook Signature
  // ========================================

  const expectedSignature = crypto
    .createHmac(
      "sha256",
      process.env.RAZORPAY_WEBHOOK_SECRET
    )
    .update(rawBody || Buffer.alloc(0))
    .digest("hex");

  if (!Buffer.isBuffer(rawBody) || !signaturesMatch(expectedSignature, signature)) {
    throw new ApiError(
      400,
      "Invalid webhook signature"
    );
  }

  // Process exactly the signed document, not a body transformed by generic middleware.
  try { payload = JSON.parse(rawBody.toString("utf8")); }
  catch { throw new ApiError(400, "Invalid webhook JSON"); }
  if (typeof payload.event !== "string" || !payload.payload) throw new ApiError(400, "Invalid webhook payload");
  const event = payload.event;

  switch (event) {

    // ======================================
    // Payment Captured
    // ======================================

    case "payment.captured":

      await handlePaymentCaptured(
        payload.payload.payment.entity
      );

      break;

    // ======================================
    // Payment Failed
    // ======================================

    case "payment.failed":

      await handlePaymentFailed(
        payload.payload.payment.entity
      );

      break;

    // ======================================
    // Refund Processed
    // ======================================

    case "refund.processed":

      await handleRefundProcessed(
        payload.payload.refund.entity
      );

      break;

    default:
      break;

  }

  return {
    received: true,
  };

};

// ==========================================
// Payment Captured
// ==========================================

const handlePaymentCaptured = async (
  paymentEntity
) => {

  const payment =
    await Payment.findOne({
      "razorpay.orderId":
        paymentEntity.order_id,
    });

  if (!payment) {
    return;
  }

  if (["refunded", "partially_refunded"].includes(payment.status)) return;
  if (paymentEntity.amount !== toPaise(payment.amount.total) ||
      paymentEntity.currency !== payment.amount.currency || paymentEntity.status !== "captured") {
    throw new ApiError(400, "Captured payment amount or currency mismatch");
  }
  payment.status = "paid";

  payment.razorpay.paymentId =
    paymentEntity.id;

  payment.paidAt = new Date();

  payment.webhook = {

    event:
      "payment.captured",

    payload: paymentEntity,

    receivedAt: new Date(),

  };

  await payment.save();

  const booking =
    await Booking.findById(
      payment.booking
    );

  if (booking && ["pending", "confirmed"].includes(booking.bookingStatus)) {

    booking.payment.status =
      "paid";

    booking.bookingStatus =
      "confirmed";

    booking.payment.paymentId =
      paymentEntity.id;

    booking.payment.paidAt =
      new Date();

    await booking.save();

  }

};

// ==========================================
// Payment Failed
// ==========================================

const handlePaymentFailed = async (
  paymentEntity
) => {

  const payment =
    await Payment.findOne({
      "razorpay.orderId":
        paymentEntity.order_id,
    });

  if (!payment) {
    return;
  }

  if (["paid", "captured", "refunded", "partially_refunded"].includes(payment.status)) return;
  payment.status = "failed";

  payment.failure = {

    code:
      paymentEntity.error_code,

    reason:
      paymentEntity.error_reason,

    source:
      paymentEntity.error_source,

    step:
      paymentEntity.error_step,

    description:
      paymentEntity.error_description,

  };

  payment.webhook = {

    event:
      "payment.failed",

    payload: paymentEntity,

    receivedAt: new Date(),

  };

  await payment.save();

  const booking =
    await Booking.findById(
      payment.booking
    );

  if (booking) {

    booking.payment.status =
      "failed";

    booking.bookingStatus =
      "expired";

    await booking.save();

    if (booking.slot) {
      await slotService.releaseSlot(
        booking.slot
      );
    }

  }

};

// ==========================================
// Refund Processed
// ==========================================

const handleRefundProcessed =
  async (
    refundEntity
  ) => {

    const payment =
      await Payment.findOne({
        "razorpay.paymentId":
          refundEntity.payment_id,
      });

    if (!payment) {
      return;
    }

    payment.status =
      "refunded";

    payment.refund = {

      refundId:
        refundEntity.id,

      amount:
        refundEntity.amount / 100,

      status:
        "processed",

      refundedAt:
        new Date(),

    };

    payment.webhook = {

      event:
        "refund.processed",

      payload:
        refundEntity,

      receivedAt:
        new Date(),

    };

    await payment.save();
    const booking = await Booking.findById(payment.booking);
    if (booking && refundEntity.amount === toPaise(payment.amount.total)) {
      booking.payment.status = "refunded";
      booking.refund = { refundId: payment.refund.refundId, amount: payment.refund.amount,
        status: "processed", refundedAt: payment.refund.refundedAt };
      booking.bookingStatus = "cancelled";
      await booking.save();
      if (booking.slot) await slotService.releaseSlot(booking.slot);
    }


  };

// ==========================================
// Get Payment By ID
// ==========================================

const getPaymentById = async (
  paymentId,
  userId
) => {

  const payment =
    await Payment.findById(paymentId)
      .populate(
        "booking"
      )
      .populate(
        "user",
        "name email phone avatar"
      )
      .populate(
        "owner",
        "name phone"
      )
      .populate(
        "turf",
        "name images address"
      );

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found"
    );
  }

  const isUser =
    payment.user._id.toString() ===
    userId.toString();

  const isOwner =
    payment.owner._id.toString() ===
    userId.toString();

  if (!isUser && !isOwner) {
    throw new ApiError(
      403,
      "Unauthorized"
    );
  }

  return payment;

};

// ==========================================
// Get My Payments
// ==========================================

const getMyPayments = async (
  userId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    status,
    paymentMethod,
  } = query;

  const filter = {
    user: userId,
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  if (paymentMethod) {
    filter.paymentMethod =
      paymentMethod;
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const payments =
    await Payment.find(filter)
      .populate(
        "booking",
        "bookingNumber bookingDate bookingStatus"
      )
      .populate(
        "turf",
        "name images"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Payment.countDocuments(
      filter
    );

  return {

    payments,

    pagination: {

      total,

      page: Number(page),

      limit: Number(limit),

      pages: Math.ceil(
        total / Number(limit)
      ),

    },

  };

};

// ==========================================
// Get Owner Payments
// ==========================================

const getOwnerPayments = async (
  ownerId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    status,
    paymentMethod,
  } = query;

  const filter = {
    owner: ownerId,
    isDeleted: false,
  };

  if (status) {
    filter.status = status;
  }

  if (paymentMethod) {
    filter.paymentMethod =
      paymentMethod;
  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const payments =
    await Payment.find(filter)
      .populate(
        "booking",
        "bookingNumber bookingDate bookingStatus"
      )
      .populate(
        "user",
        "name phone avatar"
      )
      .populate(
        "turf",
        "name"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Payment.countDocuments(
      filter
    );

  return {

    payments,

    pagination: {

      total,

      page: Number(page),

      limit: Number(limit),

      pages: Math.ceil(
        total / Number(limit)
      ),

    },

  };

};
// ==========================================
// Get Revenue Summary
// ==========================================

const getRevenue = async (ownerId) => {

  const revenue = await Payment.aggregate([
    {
      $match: {
        owner: ownerId,
        status: {
          $in: ["paid", "captured"],
        },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,

        totalRevenue: {
          $sum: "$amount.total",
        },

        totalTransactions: {
          $sum: 1,
        },

        averageTransaction: {
          $avg: "$amount.total",
        },
      },
    },
  ]);

  return revenue[0] || {
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  };

};

// ==========================================
// Monthly Revenue
// ==========================================

const getMonthlyRevenue = async (
  ownerId,
  year
) => {

  return await Payment.aggregate([
    {
      $match: {
        owner: ownerId,
        status: {
          $in: ["paid", "captured"],
        },
        isDeleted: false,
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: {
          month: {
            $month: "$createdAt",
          },
        },

        revenue: {
          $sum: "$amount.total",
        },

        transactions: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        "_id.month": 1,
      },
    },
  ]);

};

// ==========================================
// Dashboard Statistics
// ==========================================

const getDashboardStatistics =
  async (ownerId) => {

    const revenue =
      await getRevenue(ownerId);

    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const startOfWeek = new Date(
      today
    );

    startOfWeek.setDate(
      today.getDate() - 7
    );

    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    // Today's Earnings

    const todayRevenue =
      await Payment.aggregate([
        {
          $match: {
            owner: ownerId,
            status: {
              $in: [
                "paid",
                "captured",
              ],
            },
            createdAt: {
              $gte:
                startOfToday,
            },
          },
        },
        {
          $group: {
            _id: null,

            revenue: {
              $sum:
                "$amount.total",
            },
          },
        },
      ]);

    // Weekly Earnings

    const weeklyRevenue =
      await Payment.aggregate([
        {
          $match: {
            owner: ownerId,
            status: {
              $in: [
                "paid",
                "captured",
              ],
            },
            createdAt: {
              $gte:
                startOfWeek,
            },
          },
        },
        {
          $group: {
            _id: null,

            revenue: {
              $sum:
                "$amount.total",
            },
          },
        },
      ]);

    // Monthly Earnings

    const monthlyRevenue =
      await Payment.aggregate([
        {
          $match: {
            owner: ownerId,
            status: {
              $in: [
                "paid",
                "captured",
              ],
            },
            createdAt: {
              $gte:
                startOfMonth,
            },
          },
        },
        {
          $group: {
            _id: null,

            revenue: {
              $sum:
                "$amount.total",
            },
          },
        },
      ]);

    return {

      totalRevenue:
        revenue.totalRevenue,

      totalTransactions:
        revenue.totalTransactions,

      averageTransaction:
        revenue.averageTransaction,

      todayRevenue:
        todayRevenue.length
          ? todayRevenue[0]
              .revenue
          : 0,

      weeklyRevenue:
        weeklyRevenue.length
          ? weeklyRevenue[0]
              .revenue
          : 0,

      monthlyRevenue:
        monthlyRevenue.length
          ? monthlyRevenue[0]
              .revenue
          : 0,

    };

};
// ==========================================
// Settlement History
// ==========================================

const getSettlementHistory = async (
  ownerId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
  } = query;

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const settlements =
    await Payment.find({
      owner: ownerId,
      "settlement.status": "completed",
      isDeleted: false,
    })
      .populate(
        "booking",
        "bookingNumber bookingDate"
      )
      .sort({
        "settlement.settledAt": -1,
      })
      .skip(skip)
      .limit(Number(limit));

  const total =
    await Payment.countDocuments({
      owner: ownerId,
      "settlement.status": "completed",
      isDeleted: false,
    });

  return {

    settlements,

    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(
        total / Number(limit)
      ),
    },

  };

};

// ==========================================
// Failed Payments
// ==========================================

const getFailedPayments = async (
  ownerId
) => {

  return await Payment.find({

    owner: ownerId,

    status: "failed",

    isDeleted: false,

  })
    .populate(
      "booking",
      "bookingNumber"
    )
    .populate(
      "user",
      "name phone"
    )
    .sort({
      createdAt: -1,
    });

};

// ==========================================
// Refund History
// ==========================================

const getRefundHistory = async (
  ownerId
) => {

  return await Payment.find({

    owner: ownerId,

    status: {
      $in: [
        "refunded",
        "partially_refunded",
      ],
    },

    isDeleted: false,

  })
    .populate(
      "booking",
      "bookingNumber"
    )
    .populate(
      "user",
      "name phone"
    )
    .sort({
      "refund.refundedAt": -1,
    });

};

// ==========================================
// Transaction Report
// ==========================================

const getTransactionReport =
  async (
    ownerId,
    from,
    to
  ) => {

    const filter = {

      owner: ownerId,

      status: {
        $in: [
          "paid",
          "captured",
          "refunded",
        ],
      },

      isDeleted: false,

    };

    if (from || to) {

      filter.createdAt = {};

      if (from) {
        filter.createdAt.$gte =
          new Date(from);
      }

      if (to) {
        filter.createdAt.$lte =
          new Date(to);
      }

    }

    return await Payment.find(filter)
      .populate(
        "booking",
        "bookingNumber bookingDate"
      )
      .populate(
        "user",
        "name phone"
      )
      .sort({
        createdAt: -1,
      });

};

// ==========================================
// Financial Summary
// ==========================================

const getFinancialSummary =
  async (ownerId) => {

    const summary =
      await Payment.aggregate([

        {
          $match: {

            owner: ownerId,

            isDeleted: false,

          },
        },

        {
          $group: {

            _id: "$status",

            totalAmount: {
              $sum:
                "$amount.total",
            },

            totalTransactions: {
              $sum: 1,
            },

          },
        },

      ]);

    return summary;

};
// ==========================================
// System Revenue (Admin)
// ==========================================

const getSystemRevenue = async () => {

  const revenue = await Payment.aggregate([
    {
      $match: {
        status: {
          $in: ["paid", "captured"],
        },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: null,

        totalRevenue: {
          $sum: "$amount.total",
        },

        totalTransactions: {
          $sum: 1,
        },

        averageTransaction: {
          $avg: "$amount.total",
        },
      },
    },
  ]);

  return (
    revenue[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageTransaction: 0,
    }
  );

};

// ==========================================
// Top Owners
// ==========================================

const getTopOwners = async (
  limit = 10
) => {

  return await Payment.aggregate([
    {
      $match: {
        status: {
          $in: ["paid", "captured"],
        },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$owner",

        totalRevenue: {
          $sum: "$amount.total",
        },

        totalBookings: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        totalRevenue: -1,
      },
    },
    {
      $limit: Number(limit),
    },
  ]);

};

// ==========================================
// Top Turfs
// ==========================================

const getTopTurfs = async (
  limit = 10
) => {

  return await Payment.aggregate([
    {
      $match: {
        status: {
          $in: ["paid", "captured"],
        },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$turf",

        revenue: {
          $sum: "$amount.total",
        },

        bookings: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        revenue: -1,
      },
    },
    {
      $limit: Number(limit),
    },
  ]);

};

// ==========================================
// Cleanup Expired Payments
// ==========================================

const cleanupExpiredPayments =
  async () => {

    const now = new Date();

    const expired =
      await Payment.find({

        status: "pending",

        expiresAt: {
          $lte: now,
        },

        isDeleted: false,

      });

    for (const payment of expired) {

      payment.status =
        "cancelled";

      await payment.save();

      const booking =
        await Booking.findById(
          payment.booking
        );

      if (booking) {

        booking.bookingStatus =
          "expired";

        booking.payment.status =
          "cancelled";

        await booking.save();

        if (booking.slot) {
          await slotService.releaseSlot(
            booking.slot
          );
        }

      }

    }

    return expired.length;

};

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Payment
  createPaymentOrder,
  verifyPayment,

  // Refund
  refundPayment,
  cancelPayment,

  // Webhook
  handleWebhook,

  // User
  getPaymentById,
  getMyPayments,

  // Owner
  getOwnerPayments,
  getRevenue,
  getMonthlyRevenue,
  getDashboardStatistics,
  getSettlementHistory,
  getFailedPayments,
  getRefundHistory,
  getTransactionReport,
  getFinancialSummary,

  // Admin
  getSystemRevenue,
  getTopOwners,
  getTopTurfs,

  // Jobs
  cleanupExpiredPayments,

};