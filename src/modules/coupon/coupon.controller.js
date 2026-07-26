// src/modules/coupon/coupon.controller.js

const couponService = require("./coupon.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Create Coupon
// ==========================================

const createCoupon = asyncHandler(
  async (req, res) => {

    const coupon =
      await couponService.createCoupon(
        req.user._id,
        req.body
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        coupon,
        "Coupon created successfully"
      )
    );

  }
);

// ==========================================
// Update Coupon
// ==========================================

const updateCoupon = asyncHandler(
  async (req, res) => {

    const coupon =
      await couponService.updateCoupon(
        req.user._id,
        req.params.id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        coupon,
        "Coupon updated successfully"
      )
    );

  }
);

// ==========================================
// Delete Coupon
// ==========================================

const deleteCoupon = asyncHandler(
  async (req, res) => {

    const result =
      await couponService.deleteCoupon(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Coupon deleted successfully"
      )
    );

  }
);
// ==========================================
// Validate Coupon
// ==========================================

const validateCoupon = asyncHandler(
  async (req, res) => {

    const coupon =
      await couponService.validateCoupon(
        req.user._id,
        req.body.code,
        req.body.bookingAmount,
        req.body.turfId
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        coupon,
        "Coupon is valid"
      )
    );

  }
);

// ==========================================
// Apply Coupon
// ==========================================

const applyCoupon = asyncHandler(
  async (req, res) => {

    const result =
      await couponService.applyCoupon(
        req.user._id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Coupon applied successfully"
      )
    );

  }
);

// ==========================================
// Remove Coupon
// ==========================================

const removeCoupon = asyncHandler(
  async (req, res) => {

    const result =
      await couponService.removeCoupon(
        req.body.bookingAmount
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Coupon removed successfully"
      )
    );

  }
);

// ==========================================
// Get Coupon By ID
// ==========================================

const getCouponById = asyncHandler(
  async (req, res) => {

    const coupon =
      await couponService.getCouponById(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        coupon,
        "Coupon fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Available Coupons
// ==========================================

const getAvailableCoupons =
  asyncHandler(
    async (req, res) => {

      const coupons =
        await couponService.getAvailableCoupons(
          req.user._id,
          req.query
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          coupons,
          "Available coupons fetched successfully"
        )
      );

    }
  );

// ==========================================
// Get Owner Coupons
// ==========================================

const getOwnerCoupons =
  asyncHandler(
    async (req, res) => {

      const coupons =
        await couponService.getOwnerCoupons(
          req.user._id,
          req.query
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          coupons,
          "Owner coupons fetched successfully"
        )
      );

    }
  );
  // ==========================================
// Toggle Coupon Status
// ==========================================

const toggleCouponStatus = asyncHandler(
  async (req, res) => {

    const coupon =
      await couponService.toggleCouponStatus(
        req.user._id,
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        coupon,
        "Coupon status updated successfully"
      )
    );

  }
);

// ==========================================
// Coupon Statistics
// ==========================================

const getCouponStatistics = asyncHandler(
  async (req, res) => {

    const statistics =
      await couponService.getCouponStatistics(
        req.user.role === "admin"
          ? null
          : req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        statistics,
        "Coupon statistics fetched successfully"
      )
    );

  }
);

// ==========================================
// Coupon Analytics
// ==========================================

const getCouponAnalytics = asyncHandler(
  async (req, res) => {

    const analytics =
      await couponService.getCouponAnalytics();

    return res.status(200).json(
      new ApiResponse(
        200,
        analytics,
        "Coupon analytics fetched successfully"
      )
    );

  }
);

// ==========================================
// Top Coupons
// ==========================================

const getTopCoupons = asyncHandler(
  async (req, res) => {

    const coupons =
      await couponService.getTopCoupons(
        req.query.limit || 10
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        coupons,
        "Top coupons fetched successfully"
      )
    );

  }
);

// ==========================================
// Coupon Usage Report
// ==========================================

const getCouponUsageReport =
  asyncHandler(
    async (req, res) => {

      const report =
        await couponService.getCouponUsageReport(
          req.user.role === "admin"
            ? null
            : req.user._id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          report,
          "Coupon usage report fetched successfully"
        )
      );

    }
  );

// ==========================================
// Expire Coupons
// ==========================================

const expireCoupons = asyncHandler(
  async (req, res) => {

    const result =
      await couponService.expireCoupons();

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Expired coupons updated successfully"
      )
    );

  }
);

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

  // Apply
  applyCoupon,
  removeCoupon,

  // Retrieval
  getCouponById,
  getAvailableCoupons,
  getOwnerCoupons,

  // Statistics
  getCouponStatistics,
  getCouponAnalytics,
  getTopCoupons,
  getCouponUsageReport,

  // Maintenance
  expireCoupons,

};