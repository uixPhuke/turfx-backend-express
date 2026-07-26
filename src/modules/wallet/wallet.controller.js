// src/modules/wallet/wallet.controller.js

const walletService = require("./wallet.service");

const ApiResponse = require("../../utils/ApiResponse");
const asyncHandler = require("../../middlewares/async.middleware");

// ==========================================
// Get Wallet
// ==========================================

const getWallet = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.getWallet(
        req.user._id
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallet,
        "Wallet fetched successfully"
      )
    );

  }
);

// ==========================================
// Create Wallet
// ==========================================

const createWallet = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.createWallet(
        req.user._id
      );

    return res.status(201).json(
      new ApiResponse(
        201,
        wallet,
        "Wallet created successfully"
      )
    );

  }
);

// ==========================================
// Credit Wallet
// ==========================================

const creditWallet = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.creditWallet(
        req.body.userId,
        {
          type: req.body.type,

          amount: req.body.amount,

          description:
            req.body.description,

          booking:
            req.body.booking,

          payment:
            req.body.payment,

          coupon:
            req.body.coupon,

          status:
            req.body.status,

          transactionId:
            req.body.transactionId,

          metadata:
            req.body.metadata,
        }
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallet,
        "Wallet credited successfully"
      )
    );

  }
);

// ==========================================
// Debit Wallet
// ==========================================

const debitWallet = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.debitWallet(
        req.body.userId,
        {
          type: req.body.type,

          amount: req.body.amount,

          description:
            req.body.description,

          booking:
            req.body.booking,

          payment:
            req.body.payment,

          coupon:
            req.body.coupon,

          status:
            req.body.status,

          transactionId:
            req.body.transactionId,

          metadata:
            req.body.metadata,
        }
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallet,
        "Wallet debited successfully"
      )
    );

  }
);
// ==========================================
// Wallet Payment
// ==========================================

const walletPayment = asyncHandler(
  async (req, res) => {

    const result =
      await walletService.walletPayment(
        req.user._id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Wallet payment completed successfully"
      )
    );

  }
);

// ==========================================
// Refund To Wallet
// ==========================================

const refundToWallet = asyncHandler(
  async (req, res) => {

    const result =
      await walletService.refundToWallet(
        req.user._id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Refund credited to wallet successfully"
      )
    );

  }
);

// ==========================================
// Cashback To Wallet
// ==========================================

const cashbackToWallet = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.cashbackToWallet(
        req.user._id,
        req.body
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallet,
        "Cashback credited successfully"
      )
    );

  }
);

// ==========================================
// Transfer Balance
// ==========================================

const transferBalance = asyncHandler(
  async (req, res) => {

    const result =
      await walletService.transferBalance(
        req.user._id,
        req.body.receiverId,
        req.body.amount,
        req.body.description
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Balance transferred successfully"
      )
    );

  }
);

// ==========================================
// Get Transaction History
// ==========================================

const getTransactionHistory =
  asyncHandler(
    async (req, res) => {

      const history =
        await walletService.getTransactionHistory(
          req.user._id,
          req.query
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          history,
          "Transaction history fetched successfully"
        )
      );

    }
  );

// ==========================================
// Get Wallet Statistics
// ==========================================

const getWalletStatistics =
  asyncHandler(
    async (req, res) => {

      const statistics =
        await walletService.getWalletStatistics(
          req.user._id
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          statistics,
          "Wallet statistics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Get Wallet By User ID (Admin)
// ==========================================

const getWalletByUserId =
  asyncHandler(
    async (req, res) => {

      const wallet =
        await walletService.getWalletByUserId(
          req.params.userId
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          wallet,
          "Wallet fetched successfully"
        )
      );

    }
  );
  // ==========================================
// Freeze Balance
// ==========================================

const freezeBalance = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.freezeBalance(
        req.params.userId,
        req.body.amount
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallet,
        "Balance frozen successfully"
      )
    );

  }
);

// ==========================================
// Unfreeze Balance
// ==========================================

const unfreezeBalance = asyncHandler(
  async (req, res) => {

    const wallet =
      await walletService.unfreezeBalance(
        req.params.userId,
        req.body.amount
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallet,
        "Balance unfrozen successfully"
      )
    );

  }
);

// ==========================================
// Toggle Wallet Status
// ==========================================

const toggleWalletStatus =
  asyncHandler(
    async (req, res) => {

      const wallet =
        await walletService.toggleWalletStatus(
          req.params.userId,
          req.body.status
        );

      return res.status(200).json(
        new ApiResponse(
          200,
          wallet,
          "Wallet status updated successfully"
        )
      );

    }
  );

// ==========================================
// Wallet Analytics
// ==========================================

const getWalletAnalytics =
  asyncHandler(
    async (req, res) => {

      const analytics =
        await walletService.getWalletAnalytics();

      return res.status(200).json(
        new ApiResponse(
          200,
          analytics,
          "Wallet analytics fetched successfully"
        )
      );

    }
  );

// ==========================================
// Top Wallets
// ==========================================

const getTopWallets = asyncHandler(
  async (req, res) => {

    const wallets =
      await walletService.getTopWallets(
        req.query.limit || 10
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        wallets,
        "Top wallets fetched successfully"
      )
    );

  }
);

// ==========================================
// Transaction Report
// ==========================================

const getTransactionReport =
  asyncHandler(
    async (req, res) => {

      const report =
        await walletService.getTransactionReport();

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
// Delete Wallet
// ==========================================

const deleteWallet = asyncHandler(
  async (req, res) => {

    const result =
      await walletService.deleteWallet(
        req.params.userId
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        result,
        "Wallet deleted successfully"
      )
    );

  }
);

// ==========================================
// Module Exports
// ==========================================

module.exports = {

  // Wallet
  getWallet,
  createWallet,

  // Transactions
  creditWallet,
  debitWallet,

  walletPayment,
  refundToWallet,
  cashbackToWallet,
  transferBalance,

  // Queries
  getTransactionHistory,
  getWalletStatistics,
  getWalletByUserId,

  // Management
  freezeBalance,
  unfreezeBalance,
  toggleWalletStatus,

  // Analytics
  getWalletAnalytics,
  getTopWallets,
  getTransactionReport,

  // Delete
  deleteWallet,

};
