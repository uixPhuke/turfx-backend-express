// src/modules/payment/payment.controller.js

const paymentService = require("./payment.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Create Payment Order
// ==========================================

const createPaymentOrder = asyncHandler(
  async (req, res) => {

    const payment =
      await paymentService.createPaymentOrder(
        req.body.bookingId,
        req.body.paymentMethod
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        payment,
        "Payment order created successfully"
      )
    );

  }
);

// ==========================================
// Verify Payment
// ==========================================

const verifyPayment = asyncHandler(
  async (req, res) => {

    const result =
      await paymentService.verifyPayment(
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Payment verified successfully"
      )
    );

  }
);

// ==========================================
// Refund Payment
// ==========================================

const refundPayment = asyncHandler(
  async (req, res) => {

    const payment =
      await paymentService.refundPayment(
        req.params.id,
        req.body.reason
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        payment,
        "Refund processed successfully"
      )
    );

  }
);

// ==========================================
// Cancel Payment
// ==========================================

const cancelPayment = asyncHandler(
  async (req, res) => {

    const payment =
      await paymentService.cancelPayment(
        req.params.id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        payment,
        "Payment cancelled successfully"
      )
    );

  }
);
// ==========================================
// Get Payment By ID
// ==========================================

const getPaymentById = asyncHandler(
  async (req, res) => {

    const payment =
      await paymentService.getPaymentById(
        req.params.id,
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        payment,
        "Payment fetched successfully"
      )
    );

  }
);

// ==========================================
// Get My Payments
// ==========================================

const getMyPayments = asyncHandler(
  async (req, res) => {

    const payments =
      await paymentService.getMyPayments(
        req.user._id,
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        payments,
        "Payments fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Owner Payments
// ==========================================

const getOwnerPayments = asyncHandler(
  async (req, res) => {

    const payments =
      await paymentService.getOwnerPayments(
        req.user._id,
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        payments,
        "Owner payments fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Revenue
// ==========================================

const getRevenue = asyncHandler(
  async (req, res) => {

    const revenue =
      await paymentService.getRevenue(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        revenue,
        "Revenue fetched successfully"
      )
    );

  }
);

// ==========================================
// Get Monthly Revenue
// ==========================================

const getMonthlyRevenue = asyncHandler(
  async (req, res) => {

    const { year } = req.query;

    const revenue =
      await paymentService.getMonthlyRevenue(
        req.user._id,
        Number(year)
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        revenue,
        "Monthly revenue fetched successfully"
      )
    );

  }
);

// ==========================================
// Dashboard Statistics
// ==========================================

const getDashboardStatistics =
  asyncHandler(
    async (req, res) => {

      const dashboard =
        await paymentService.getDashboardStatistics(
          req.user._id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          dashboard,
          "Dashboard statistics fetched successfully"
        )
      );

    }
  );

  // ==========================================
// Settlement History
// ==========================================

const getSettlementHistory = asyncHandler(
  async (req, res) => {

    const settlements =
      await paymentService.getSettlementHistory(
        req.user._id,
        req.query
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        settlements,
        "Settlement history fetched successfully"
      )
    );

  }
);

// ==========================================
// Failed Payments
// ==========================================

const getFailedPayments = asyncHandler(
  async (req, res) => {

    const payments =
      await paymentService.getFailedPayments(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        payments,
        "Failed payments fetched successfully"
      )
    );

  }
);

// ==========================================
// Refund History
// ==========================================

const getRefundHistory = asyncHandler(
  async (req, res) => {

    const refunds =
      await paymentService.getRefundHistory(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        refunds,
        "Refund history fetched successfully"
      )
    );

  }
);

// ==========================================
// Transaction Report
// ==========================================

const getTransactionReport = asyncHandler(
  async (req, res) => {

    const {
      from,
      to,
    } = req.query;

    const report =
      await paymentService.getTransactionReport(
        req.user._id,
        from,
        to
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        report,
        "Transaction report fetched successfully"
      )
    );

  }
);

// ==========================================
// Financial Summary
// ==========================================

const getFinancialSummary = asyncHandler(
  async (req, res) => {

    const summary =
      await paymentService.getFinancialSummary(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        summary,
        "Financial summary fetched successfully"
      )
    );

  }
);

// ==========================================
// System Revenue (Admin)
// ==========================================

const getSystemRevenue = asyncHandler(
  async (req, res) => {

    const revenue =
      await paymentService.getSystemRevenue();

    return res.status(200).json(
      new ApiResponse(
        200,
        revenue,
        "System revenue fetched successfully"
      )
    );

  }
);

// ==========================================
// Top Owners (Admin)
// ==========================================

const getTopOwners = asyncHandler(
  async (req, res) => {

    const owners =
      await paymentService.getTopOwners(
        req.query.limit
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        owners,
        "Top owners fetched successfully"
      )
    );

  }
);

// ==========================================
// Top Turfs (Admin)
// ==========================================

const getTopTurfs = asyncHandler(
  async (req, res) => {

    const turfs =
      await paymentService.getTopTurfs(
        req.query.limit
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        turfs,
        "Top turfs fetched successfully"
      )
    );

  }
);

// ==========================================
// Razorpay Webhook
// ==========================================

const handleWebhook = asyncHandler(
  async (req, res) => {

    const signature =
      req.headers["x-razorpay-signature"];

    const result =
      await paymentService.handleWebhook(
        signature,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Webhook processed successfully"
      )
    );

  }
);

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Payment
  createPaymentOrder,
  verifyPayment,
  refundPayment,
  cancelPayment,

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

  // Webhook
  handleWebhook,

};