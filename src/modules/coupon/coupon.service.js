const Coupon = require("./coupon.model");
const User = require("../user/user.model");

const ApiError = require("../../utils/ApiError");

// ==========================================
// Calculate Expiry Status
// ==========================================

const isExpired = (coupon) => {
  return new Date() > coupon.validUntil;
};

// ==========================================
// Check Coupon Availability
// ==========================================

const isCouponActive = (coupon) => {

  if (!coupon.isActive) return false;

  if (coupon.isDeleted) return false;

  if (isExpired(coupon)) return false;

  return true;

};

// ==========================================
// Create Coupon
// ==========================================

const createCoupon = async (
  ownerId,
  data
) => {

  // ========================================
  // Owner Validation
  // ========================================

  const owner = await User.findById(ownerId);

  if (!owner) {

    throw new ApiError(
      404,
      "Owner not found"
    );

  }

  if (
    owner.role !== "owner" &&
    owner.role !== "admin"
  ) {

    throw new ApiError(
      403,
      "Only owners and admins can create coupons"
    );

  }

  // ========================================
  // Duplicate Coupon Code
  // ========================================

  const existingCoupon =
    await Coupon.findOne({

      code:
        data.code.toUpperCase(),

      isDeleted: false,

    });

  if (existingCoupon) {

    throw new ApiError(
      409,
      "Coupon code already exists"
    );

  }

  // ========================================
  // Date Validation
  // ========================================

  if (
    new Date(data.validUntil) <=
    new Date(data.validFrom)
  ) {

    throw new ApiError(
      400,
      "Valid until date must be after valid from date"
    );

  }
    // ========================================
  // Create Coupon
  // ========================================

  const coupon = await Coupon.create({

    code: data.code.toUpperCase(),

    title: data.title,

    description:
      data.description || "",

    type: data.type,

    value: data.value,

    minimumBookingAmount:
      data.minimumBookingAmount || 0,

    maximumDiscount:
      data.maximumDiscount || 0,

    usageLimit:
      data.usageLimit || 0,

    usagePerUser:
      data.usagePerUser || 1,

    validFrom:
      data.validFrom,

    validUntil:
      data.validUntil,

    applicableTurfs:
      data.applicableTurfs || [],

    owner:
      data.isGlobal
        ? null
        : ownerId,

    isGlobal:
      data.isGlobal || false,

    firstBookingOnly:
      data.firstBookingOnly || false,

    isActive:
      data.isActive ?? true,

  });

  // ========================================
  // Populate Owner
  // ========================================

  await coupon.populate(
    "owner",
    "name email"
  );

  return coupon;

};

// ==========================================
// Update Coupon
// ==========================================

const updateCoupon = async (
  ownerId,
  couponId,
  data
) => {

  const coupon =
    await Coupon.findById(
      couponId
    );

  if (
    !coupon ||
    coupon.isDeleted
  ) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  // ========================================
  // Authorization
  // ========================================

  const owner =
    await User.findById(ownerId);

  if (!owner) {

    throw new ApiError(
      404,
      "Owner not found"
    );

  }

  const isAdmin =
    owner.role === "admin";

  const isCouponOwner =
    coupon.owner &&
    coupon.owner.toString() ===
      ownerId.toString();

  if (
    !isAdmin &&
    !isCouponOwner
  ) {

    throw new ApiError(
      403,
      "You are not authorized to update this coupon"
    );

  }

  // ========================================
  // Duplicate Code Check
  // ========================================

  if (
    data.code &&
    data.code.toUpperCase() !==
      coupon.code
  ) {

    const exists =
      await Coupon.findOne({

        code:
          data.code.toUpperCase(),

        _id: {
          $ne: couponId,
        },

        isDeleted: false,

      });

    if (exists) {

      throw new ApiError(
        409,
        "Coupon code already exists"
      );

    }

    coupon.code =
      data.code.toUpperCase();

  }

  // ========================================
  // Update Fields
  // ========================================

  const fields = [

    "title",
    "description",
    "type",
    "value",
    "minimumBookingAmount",
    "maximumDiscount",
    "usageLimit",
    "usagePerUser",
    "validFrom",
    "validUntil",
    "isActive",
    "isGlobal",
    "firstBookingOnly",

  ];

  fields.forEach((field) => {

    if (
      data[field] !== undefined
    ) {

      coupon[field] =
        data[field];

    }

  });

  if (
    data.applicableTurfs
  ) {

    coupon.applicableTurfs =
      data.applicableTurfs;

  }

  // ========================================
  // Date Validation
  // ========================================

  if (
    coupon.validUntil <=
    coupon.validFrom
  ) {

    throw new ApiError(
      400,
      "Valid until date must be after valid from date"
    );

  }

  await coupon.save();

  await coupon.populate(
    "owner",
    "name email"
  );

  return coupon;

};

// ==========================================
// Delete Coupon
// ==========================================

const deleteCoupon = async (
  ownerId,
  couponId
) => {

  const coupon =
    await Coupon.findById(
      couponId
    );

  if (
    !coupon ||
    coupon.isDeleted
  ) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  // ========================================
  // Authorization
  // ========================================

  const owner =
    await User.findById(ownerId);

  if (!owner) {

    throw new ApiError(
      404,
      "Owner not found"
    );

  }

  const isAdmin =
    owner.role === "admin";

  const isCouponOwner =
    coupon.owner &&
    coupon.owner.toString() ===
      ownerId.toString();

  if (
    !isAdmin &&
    !isCouponOwner
  ) {

    throw new ApiError(
      403,
      "You are not authorized to delete this coupon"
    );

  }

  // ========================================
  // Soft Delete
  // ========================================

  coupon.isDeleted = true;

  coupon.isActive = false;

  await coupon.save();

  return {

    success: true,

    message:
      "Coupon deleted successfully",

  };

};

// ==========================================
// Validate Coupon
// ==========================================

const validateCoupon = async (
  userId,
  code,
  bookingAmount,
  turfId
) => {

  const coupon =
    await Coupon.findOne({

      code: code.toUpperCase(),

      isDeleted: false,

      isActive: true,

    });

  if (!coupon) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  // ========================================
  // Date Validation
  // ========================================

  const now = new Date();

  if (now < coupon.validFrom) {

    throw new ApiError(
      400,
      "Coupon is not active yet"
    );

  }

  if (now > coupon.validUntil) {

    throw new ApiError(
      400,
      "Coupon has expired"
    );

  }

  // ========================================
  // Usage Limit
  // ========================================

  if (
    coupon.usageLimit > 0 &&
    coupon.usedCount >= coupon.usageLimit
  ) {

    throw new ApiError(
      400,
      "Coupon usage limit exceeded"
    );

  }

  // ========================================
  // User Usage Limit
  // ========================================

  const usage =
    coupon.userUsage.find(
      (item) =>
        item.user.toString() ===
        userId.toString()
    );

  if (
    usage &&
    usage.usedCount >=
      coupon.usagePerUser
  ) {

    throw new ApiError(
      400,
      "You have already used this coupon the maximum number of times"
    );

  }

  // ========================================
  // Minimum Booking Amount
  // ========================================

  if (
    bookingAmount <
    coupon.minimumBookingAmount
  ) {

    throw new ApiError(
      400,
      `Minimum booking amount is ₹${coupon.minimumBookingAmount}`
    );

  }

  // ========================================
  // Turf Validation
  // ========================================

  if (
    coupon.applicableTurfs.length > 0
  ) {

    const applicable =
      coupon.applicableTurfs.some(
        (id) =>
          id.toString() ===
          turfId.toString()
      );

    if (!applicable) {

      throw new ApiError(
        400,
        "Coupon is not applicable for this turf"
      );

    }

  }

  return coupon;

};

// ==========================================
// Calculate Discount
// ==========================================

const calculateDiscount = async (
  coupon,
  bookingAmount
) => {

  let discount = 0;

  switch (coupon.type) {

    case "percentage":

      discount =
        (bookingAmount *
          coupon.value) /
        100;

      if (
        coupon.maximumDiscount > 0
      ) {

        discount = Math.min(
          discount,
          coupon.maximumDiscount
        );

      }

      break;

    case "flat":

      discount = Math.min(
        coupon.value,
        bookingAmount
      );

      break;

    case "free_booking":

      discount =
        bookingAmount;

      break;

    case "cashback":

      discount = Math.min(
        coupon.value,
        bookingAmount
      );

      break;

    case "first_booking":

      discount =
        (bookingAmount *
          coupon.value) /
        100;

      if (
        coupon.maximumDiscount > 0
      ) {

        discount = Math.min(
          discount,
          coupon.maximumDiscount
        );

      }

      break;

    default:

      discount = 0;

  }

  return {

    couponId: coupon._id,

    code: coupon.code,

    type: coupon.type,

    discount,

    finalAmount:
      Math.max(
        0,
        bookingAmount - discount
      ),

  };

};

const Booking = require("../booking/booking.model");

// ==========================================
// Apply Coupon
// ==========================================

const applyCoupon = async (
  userId,
  data
) => {

  const {
    code,
    bookingAmount,
    turfId,
  } = data;

  // ========================================
  // Validate Coupon
  // ========================================

  const coupon =
    await validateCoupon(
      userId,
      code,
      bookingAmount,
      turfId
    );

  // ========================================
  // First Booking Validation
  // ========================================

  if (coupon.firstBookingOnly) {

    const previousBookings =
      await Booking.countDocuments({

        user: userId,

        bookingStatus: "completed",

      });

    if (previousBookings > 0) {

      throw new ApiError(
        400,
        "This coupon is valid only for your first booking"
      );

    }

  }

  // ========================================
  // Calculate Discount
  // ========================================

  const discount =
    await calculateDiscount(
      coupon,
      bookingAmount
    );

  return {

    success: true,

    coupon: {

      id: coupon._id,

      code: coupon.code,

      title: coupon.title,

      type: coupon.type,

    },

    discount,

  };

};

// ==========================================
// Remove Coupon
// ==========================================

const removeCoupon = async (
  bookingAmount
) => {

  return {

    success: true,

    message:
      "Coupon removed successfully",

    discount: {

      couponId: null,

      code: null,

      discount: 0,

      finalAmount:
        bookingAmount,

    },

  };

};

// ==========================================
// Get Coupon By ID
// ==========================================

const getCouponById = async (
  couponId
) => {

  const coupon =
    await Coupon.findOne({

      _id: couponId,

      isDeleted: false,

    })
      .populate(
        "owner",
        "name email"
      )
      .populate(
        "applicableTurfs",
        "name location"
      );

  if (!coupon) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  return coupon;

};

// ==========================================
// Get Available Coupons
// ==========================================

const getAvailableCoupons = async (
  userId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    type,
  } = query;

  const filter = {

    isDeleted: false,

    isActive: true,

    validFrom: {
      $lte: new Date(),
    },

    validUntil: {
      $gte: new Date(),
    },

  };

  if (type) {

    filter.type = type;

  }

  const skip =
    (Number(page) - 1) *
    Number(limit);

  const coupons =
    await Coupon.find(filter)
      .populate(
        "owner",
        "name"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

  const availableCoupons =
    coupons.filter(
      (coupon) => {

        const usage =
          coupon.userUsage.find(
            (item) =>
              item.user.toString() ===
              userId.toString()
          );

        return (
          !usage ||
          usage.usedCount <
            coupon.usagePerUser
        );

      }
    );

  const total =
    await Coupon.countDocuments(
      filter
    );

  return {

    coupons:
      availableCoupons,

    pagination: {

      total,

      page:
        Number(page),

      limit:
        Number(limit),

      pages:
        Math.ceil(
          total /
            Number(limit)
        ),

    },

  };

};

// ==========================================
// Get Owner Coupons
// ==========================================

const getOwnerCoupons =
  async (
    ownerId,
    query = {}
  ) => {

    const {
      page = 1,
      limit = 10,
      isActive,
    } = query;

    const filter = {

      owner: ownerId,

      isDeleted: false,

    };

    if (
      isActive !==
      undefined
    ) {

      filter.isActive =
        isActive === "true";

    }

    const skip =
      (Number(page) - 1) *
      Number(limit);

    const coupons =
      await Coupon.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(Number(limit));

    const total =
      await Coupon.countDocuments(
        filter
      );

    return {

      coupons,

      pagination: {

        total,

        page:
          Number(page),

        limit:
          Number(limit),

        pages:
          Math.ceil(
            total /
              Number(limit)
          ),

      },

    };

};

// ==========================================
// Increment Coupon Usage
// ==========================================

const incrementCouponUsage = async (
  couponId,
  userId
) => {

  const coupon =
    await Coupon.findById(
      couponId
    );

  if (
    !coupon ||
    coupon.isDeleted
  ) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  // Total Usage

  coupon.usedCount += 1;

  // User Usage

  const usage =
    coupon.userUsage.find(
      (item) =>
        item.user.toString() ===
        userId.toString()
    );

  if (usage) {

    usage.usedCount += 1;

    usage.lastUsedAt =
      new Date();

  } else {

    coupon.userUsage.push({

      user: userId,

      usedCount: 1,

      lastUsedAt:
        new Date(),

    });

  }

  await coupon.save();

  return coupon;

};

// ==========================================
// Decrement Coupon Usage
// ==========================================

const decrementCouponUsage = async (
  couponId,
  userId
) => {

  const coupon =
    await Coupon.findById(
      couponId
    );

  if (
    !coupon ||
    coupon.isDeleted
  ) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  if (
    coupon.usedCount > 0
  ) {

    coupon.usedCount -= 1;

  }

  const usage =
    coupon.userUsage.find(
      (item) =>
        item.user.toString() ===
        userId.toString()
    );

  if (
    usage &&
    usage.usedCount > 0
  ) {

    usage.usedCount -= 1;

  }

  await coupon.save();

  return coupon;

};

// ==========================================
// Coupon Statistics
// ==========================================

const getCouponStatistics =
  async (
    ownerId = null
  ) => {

    const match = {

      isDeleted: false,

    };

    if (ownerId) {

      match.owner =
        ownerId;

    }

    const stats =
      await Coupon.aggregate([

        {
          $match: match,
        },

        {
          $group: {

            _id: null,

            totalCoupons: {
              $sum: 1,
            },

            activeCoupons: {
              $sum: {

                $cond: [

                  {
                    $eq: [
                      "$isActive",
                      true,
                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            inactiveCoupons: {
              $sum: {

                $cond: [

                  {
                    $eq: [
                      "$isActive",
                      false,
                    ],
                  },

                  1,

                  0,

                ],

              },

            },

            totalUsage: {
              $sum:
                "$usedCount",
            },

            globalCoupons: {
              $sum: {

                $cond: [

                  {
                    $eq: [
                      "$isGlobal",
                      true,
                    ],
                  },

                  1,

                  0,

                ],

              },

            },

          },

        },

      ]);

    return (

      stats[0] || {

        totalCoupons: 0,

        activeCoupons: 0,

        inactiveCoupons: 0,

        totalUsage: 0,

        globalCoupons: 0,

      }

    );

};

// ==========================================
// Coupon Analytics (Admin)
// ==========================================

const getCouponAnalytics = async () => {

  const analytics = await Coupon.aggregate([

    {
      $match: {
        isDeleted: false,
      },
    },

    {
      $group: {

        _id: "$type",

        totalCoupons: {
          $sum: 1,
        },

        totalUsage: {
          $sum: "$usedCount",
        },

        activeCoupons: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$isActive",
                  true,
                ],
              },
              1,
              0,
            ],
          },
        },

        inactiveCoupons: {
          $sum: {
            $cond: [
              {
                $eq: [
                  "$isActive",
                  false,
                ],
              },
              1,
              0,
            ],
          },
        },

      },

    },

    {
      $sort: {
        totalUsage: -1,
      },
    },

  ]);

  return analytics;

};

// ==========================================
// Top Coupons
// ==========================================

const getTopCoupons = async (
  limit = 10
) => {

  return await Coupon.find({

    isDeleted: false,

  })

    .select(
      "code title type usedCount value"
    )

    .sort({

      usedCount: -1,

      createdAt: -1,

    })

    .limit(Number(limit))

    .populate(
      "owner",
      "name"
    );

};

// ==========================================
// Coupon Usage Report
// ==========================================

const getCouponUsageReport =
  async (
    ownerId = null
  ) => {

    const match = {

      isDeleted: false,

    };

    if (ownerId) {

      match.owner = ownerId;

    }

    const report =
      await Coupon.aggregate([

        {
          $match: match,
        },

        {
          $project: {

            code: 1,

            title: 1,

            type: 1,

            usedCount: 1,

            usageLimit: 1,

            remainingUsage: {

              $cond: [

                {
                  $eq: [
                    "$usageLimit",
                    0,
                  ],
                },

                null,

                {
                  $subtract: [
                    "$usageLimit",
                    "$usedCount",
                  ],
                },

              ],

            },

            usagePercentage: {

              $cond: [

                {
                  $eq: [
                    "$usageLimit",
                    0,
                  ],
                },

                null,

                {
                  $multiply: [

                    {
                      $divide: [
                        "$usedCount",
                        "$usageLimit",
                      ],
                    },

                    100,

                  ],

                },

              ],

            },

            validUntil: 1,

            isActive: 1,

          },

        },

        {
          $sort: {

            usedCount: -1,

          },

        },

      ]);

    return report;

};

// ==========================================
// Expire Coupons
// ==========================================

const expireCoupons = async () => {

  const now = new Date();

  const result =
    await Coupon.updateMany(
      {
        validUntil: {
          $lt: now,
        },

        isActive: true,

        isDeleted: false,
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

  return {

    success: true,

    expiredCoupons:
      result.modifiedCount,

  };

};

// ==========================================
// Toggle Coupon Status
// ==========================================

const toggleCouponStatus = async (
  ownerId,
  couponId
) => {

  const coupon =
    await Coupon.findById(
      couponId
    );

  if (
    !coupon ||
    coupon.isDeleted
  ) {

    throw new ApiError(
      404,
      "Coupon not found"
    );

  }

  const owner =
    await User.findById(
      ownerId
    );

  if (!owner) {

    throw new ApiError(
      404,
      "Owner not found"
    );

  }

  const isAdmin =
    owner.role === "admin";

  const isCouponOwner =
    coupon.owner &&
    coupon.owner.toString() ===
      ownerId.toString();

  if (
    !isAdmin &&
    !isCouponOwner
  ) {

    throw new ApiError(
      403,
      "You are not authorized to modify this coupon"
    );

  }

  coupon.isActive =
    !coupon.isActive;

  await coupon.save();

  return coupon;

};

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Create
  createCoupon,

  // Update
  updateCoupon,

  toggleCouponStatus,

  // Delete
  deleteCoupon,

  // Validation
  validateCoupon,

  // Discount
  calculateDiscount,

  applyCoupon,

  removeCoupon,

  // Retrieval
  getCouponById,

  getAvailableCoupons,

  getOwnerCoupons,

  // Usage
  incrementCouponUsage,

  decrementCouponUsage,

  // Statistics
  getCouponStatistics,

  getCouponAnalytics,

  getTopCoupons,

  getCouponUsageReport,

  // Maintenance
  expireCoupons,

};