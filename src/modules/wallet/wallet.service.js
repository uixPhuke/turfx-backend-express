// src/modules/wallet/wallet.service.js

const Wallet = require("./wallet.model");
const User = require("../user/user.model");

const ApiError = require("../../utils/ApiError");

// ==========================================
// Helper Functions
// ==========================================

// Validate Wallet Status
const validateWalletStatus = (wallet) => {

  if (!wallet) {

    throw new ApiError(
      404,
      "Wallet not found"
    );

  }

  if (wallet.isDeleted) {

    throw new ApiError(
      404,
      "Wallet not found"
    );

  }

  if (wallet.status === "blocked") {

    throw new ApiError(
      403,
      "Wallet has been blocked"
    );

  }

  if (wallet.status === "frozen") {

    throw new ApiError(
      403,
      "Wallet has been frozen"
    );

  }

};

// ==========================================
// Get Wallet
// ==========================================

const getWallet = async (
  userId
) => {

  const wallet =
    await Wallet.findOne({

      user: userId,

      isDeleted: false,

    }).populate(
      "user",
      "name email phone"
    );

  validateWalletStatus(wallet);

  return wallet;

};

// ==========================================
// Create Wallet
// ==========================================

const createWallet = async (
  userId
) => {

  const user =
    await User.findById(
      userId
    );

  if (!user) {

    throw new ApiError(
      404,
      "User not found"
    );

  }

  const existingWallet =
    await Wallet.findOne({

      user: userId,

      isDeleted: false,

    });

  if (existingWallet) {

    return existingWallet;

  }

  const wallet =
    await Wallet.create({

      user: userId,

      balance: 0,

      currency: "INR",

    });

  await wallet.populate(
    "user",
    "name email phone"
  );

  return wallet;

};

// ==========================================
// Credit Wallet
// ==========================================

const creditWallet = async (
  userId,
  transaction
) => {

  const wallet =
    await Wallet.getOrCreateWallet(
      userId
    );

  validateWalletStatus(
    wallet
  );

  await wallet.credit({

    type:
      transaction.type,

    amount:
      transaction.amount,

    description:
      transaction.description,

    booking:
      transaction.booking || null,

    payment:
      transaction.payment || null,

    coupon:
      transaction.coupon || null,

    status:
      transaction.status ||
      "completed",

    transactionId:
      transaction.transactionId ||
      null,

    metadata:
      transaction.metadata ||
      {},

  });

  return wallet.populate(
    "user",
    "name email phone"
  );

};

// ==========================================
// Debit Wallet
// ==========================================


// ==========================================
// Wallet Payment
// ==========================================

const walletPayment = async (
  userId,
  data
) => {

  const {
    bookingId,
    amount,
  } = data;

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {

    throw new ApiError(
      404,
      "Booking not found"
    );

  }

  if (
    booking.user.toString() !==
    userId.toString()
  ) {

    throw new ApiError(
      403,
      "You are not authorized to pay for this booking"
    );

  }

  if (
    booking.paymentStatus ===
    "paid"
  ) {

    throw new ApiError(
      400,
      "Booking has already been paid"
    );

  }

  const wallet =
    await debitWallet(
      userId,
      {

        type:
          "booking_payment",

        amount,

        description:
          `Wallet payment for booking ${booking.bookingId || booking._id}`,

        booking:
          booking._id,

      }
    );

  booking.paymentStatus =
    "paid";

  await booking.save();

  let payment =
    await Payment.findOne({

      booking:
        booking._id,

    });

  if (!payment) {

    payment =
      await Payment.create({

        booking:
          booking._id,

        user:
          userId,

        amount,

        paymentMethod:
          "wallet",

        paymentStatus:
          "success",

      });

    }

  return {

    wallet,

    payment,

    booking,

  };

};

// ==========================================
// Refund To Wallet
// ==========================================

const refundToWallet = async (
  userId,
  data
) => {

  const {
    bookingId,
    paymentId,
    amount,
    reason,
  } = data;

  const booking =
    await Booking.findById(
      bookingId
    );

  if (!booking) {

    throw new ApiError(
      404,
      "Booking not found"
    );

  }

  const payment =
    await Payment.findById(
      paymentId
    );

  if (!payment) {

    throw new ApiError(
      404,
      "Payment not found"
    );

  }

  const wallet =
    await creditWallet(
      userId,
      {

        type: "refund",

        amount,

        description:
          reason ||
          "Booking refund",

        booking:
          booking._id,

        payment:
          payment._id,

      }
    );

  payment.paymentStatus =
    "refunded";

  await payment.save();

  booking.paymentStatus =
    "refunded";

  await booking.save();

  return {

    wallet,

    booking,

    payment,

  };

};



const debitWallet = async (
  userId,
  transaction
) => {

  const wallet =
    await Wallet.getOrCreateWallet(
      userId
    );

  validateWalletStatus(
    wallet
  );

  if (
    wallet.availableBalance <
    transaction.amount
  ) {

    throw new ApiError(
      400,
      "Insufficient wallet balance"
    );

  }

  await wallet.debit({

    type:
      transaction.type,

    amount:
      transaction.amount,

    description:
      transaction.description,

    booking:
      transaction.booking || null,

    payment:
      transaction.payment || null,

    coupon:
      transaction.coupon || null,

    status:
      transaction.status ||
      "completed",

    transactionId:
      transaction.transactionId ||
      null,

    metadata:
      transaction.metadata ||
      {},

  });

  return wallet.populate(
    "user",
    "name email phone"
  );

};

// ==========================================
// Cashback To Wallet
// ==========================================

const cashbackToWallet = async (
  userId,
  data
) => {

  const {
    amount,
    bookingId,
    paymentId,
    couponId,
    description,
  } = data;

  if (amount <= 0) {

    throw new ApiError(
      400,
      "Invalid cashback amount"
    );

  }

  const wallet =
    await creditWallet(
      userId,
      {

        type: "cashback",

        amount,

        description:
          description ||
          "Coupon cashback",

        booking:
          bookingId || null,

        payment:
          paymentId || null,

        coupon:
          couponId || null,

      }
    );

  return wallet;

};

// ==========================================
// Transfer Balance
// ==========================================

const transferBalance = async (
  senderId,
  receiverId,
  amount,
  description = "Wallet transfer"
) => {

  if (
    senderId.toString() ===
    receiverId.toString()
  ) {

    throw new ApiError(
      400,
      "You cannot transfer money to your own wallet"
    );

  }

  if (amount <= 0) {

    throw new ApiError(
      400,
      "Transfer amount must be greater than ₹0"
    );

  }

  const receiver =
    await User.findById(
      receiverId
    );

  if (!receiver) {

    throw new ApiError(
      404,
      "Receiver not found"
    );

  }

  // Debit Sender

  await debitWallet(
    senderId,
    {

      type: "debit",

      amount,

      description: `Transfer to ${receiver.name}`,

      metadata: {
        receiver: receiverId,
      },

    }
  );

  // Credit Receiver

  await creditWallet(
    receiverId,
    {

      type: "credit",

      amount,

      description: `Transfer from user`,

      metadata: {
        sender: senderId,
      },

    }
  );

  return {

    success: true,

    amount,

    message:
      "Wallet transfer completed successfully",

  };

};

// ==========================================
// Get Transaction History
// ==========================================

const getTransactionHistory = async (
  userId,
  query = {}
) => {

  const {
    page = 1,
    limit = 10,
    type,
    status,
  } = query;

  const wallet =
    await getWallet(userId);

  let transactions = [
    ...wallet.transactions,
  ];

  if (type) {

    transactions =
      transactions.filter(
        (transaction) =>
          transaction.type === type
      );

  }

  if (status) {

    transactions =
      transactions.filter(
        (transaction) =>
          transaction.status === status
      );

  }

  transactions.sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );

  const total =
    transactions.length;

  const start =
    (Number(page) - 1) *
    Number(limit);

  const end =
    start + Number(limit);

  return {

    transactions:
      transactions.slice(
        start,
        end
      ),

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
// Get Wallet Statistics
// ==========================================

const getWalletStatistics =
  async (
    userId
  ) => {

    const wallet =
      await getWallet(
        userId
      );

    return {

      balance:
        wallet.balance,

      availableBalance:
        wallet.availableBalance,

      frozenBalance:
        wallet.frozenBalance,

      totalCredited:
        wallet.totalCredited,

      totalDebited:
        wallet.totalDebited,

      totalCashback:
        wallet.totalCashback,

      totalRefund:
        wallet.totalRefund,

      rewardPoints:
        wallet.rewardPoints,

      transactionCount:
        wallet.transactionCount,

      currency:
        wallet.currency,

      status:
        wallet.status,

    };

};

// ==========================================
// Get Wallet By User ID (Admin)
// ==========================================

const getWalletByUserId =
  async (
    userId
  ) => {

    const wallet =
      await Wallet.findOne({

        user: userId,

        isDeleted: false,

      })
        .populate(
          "user",
          "name email phone role"
        );

    if (!wallet) {

      throw new ApiError(
        404,
        "Wallet not found"
      );

    }

    return wallet;

};

const freezeBalance = async (
  userId,
  amount
) => {

  const wallet =
    await getWallet(userId);

  if (amount <= 0) {

    throw new ApiError(
      400,
      "Invalid freeze amount"
    );

  }

  if (
    wallet.availableBalance <
    amount
  ) {

    throw new ApiError(
      400,
      "Insufficient available balance"
    );

  }

  wallet.frozenBalance += amount;

  wallet.lastTransactionAt =
    new Date();

  await wallet.save();

  return wallet;

};

// ==========================================
// Unfreeze Balance
// ==========================================

const unfreezeBalance = async (
  userId,
  amount
) => {

  const wallet =
    await getWallet(userId);

  if (amount <= 0) {

    throw new ApiError(
      400,
      "Invalid unfreeze amount"
    );

  }

  if (
    wallet.frozenBalance <
    amount
  ) {

    throw new ApiError(
      400,
      "Frozen balance is insufficient"
    );

  }

  wallet.frozenBalance -= amount;

  wallet.lastTransactionAt =
    new Date();

  await wallet.save();

  return wallet;

};

// ==========================================
// Toggle Wallet Status
// ==========================================

const toggleWalletStatus = async (
  userId,
  status
) => {

  const wallet =
    await Wallet.findOne({

      user: userId,

      isDeleted: false,

    });

  if (!wallet) {

    throw new ApiError(
      404,
      "Wallet not found"
    );

  }

  const allowedStatuses = [

    "active",

    "frozen",

    "blocked",

  ];

  if (
    !allowedStatuses.includes(
      status
    )
  ) {

    throw new ApiError(
      400,
      "Invalid wallet status"
    );

  }

  wallet.status = status;

  wallet.updatedBy = userId;

  await wallet.save();

  return wallet.populate(
    "user",
    "name email phone"
  );

};

// ==========================================
// Wallet Analytics (Admin)
// ==========================================

const getWalletAnalytics = async () => {

  const analytics =
    await Wallet.aggregate([

      {
        $match: {
          isDeleted: false,
        },
      },

      {
        $group: {

          _id: null,

          totalWallets: {
            $sum: 1,
          },

          activeWallets: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "active",
                  ],
                },
                1,
                0,
              ],
            },
          },

          frozenWallets: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "frozen",
                  ],
                },
                1,
                0,
              ],
            },
          },

          blockedWallets: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "blocked",
                  ],
                },
                1,
                0,
              ],
            },
          },

          totalBalance: {
            $sum: "$balance",
          },

          totalFrozenBalance: {
            $sum: "$frozenBalance",
          },

          totalCashback: {
            $sum: "$totalCashback",
          },

          totalRefund: {
            $sum: "$totalRefund",
          },

          totalRewardPoints: {
            $sum: "$rewardPoints",
          },

        },

      },

    ]);

  return analytics[0] || {};

};

// ==========================================
// Top Wallets
// ==========================================

const getTopWallets = async (
  limit = 10
) => {

  return await Wallet.find({

    isDeleted: false,

  })

    .populate(
      "user",
      "name email"
    )

    .sort({

      balance: -1,

      totalCashback: -1,

    })

    .limit(Number(limit));

};

// ==========================================
// Transaction Report
// ==========================================

const getTransactionReport =
  async () => {

    const wallets =
      await Wallet.find({

        isDeleted: false,

      }).populate(
        "user",
        "name email"
      );

    const report =
      wallets.map(
        (wallet) => ({

          user: wallet.user,

          balance:
            wallet.balance,

          availableBalance:
            wallet.availableBalance,

          frozenBalance:
            wallet.frozenBalance,

          totalCredited:
            wallet.totalCredited,

          totalDebited:
            wallet.totalDebited,

          totalCashback:
            wallet.totalCashback,

          totalRefund:
            wallet.totalRefund,

          rewardPoints:
            wallet.rewardPoints,

          transactionCount:
            wallet.transactionCount,

          status:
            wallet.status,

        })
      );

    return report;

};

// ==========================================
// Delete Wallet (Soft Delete)
// ==========================================

const deleteWallet = async (
  userId
) => {

  const wallet =
    await Wallet.findOne({

      user: userId,

      isDeleted: false,

    });

  if (!wallet) {

    throw new ApiError(
      404,
      "Wallet not found"
    );

  }

  // ========================================
  // Prevent Deletion With Balance
  // ========================================

  if (wallet.balance > 0) {

    throw new ApiError(
      400,
      "Wallet with available balance cannot be deleted"
    );

  }

  if (wallet.frozenBalance > 0) {

    throw new ApiError(
      400,
      "Wallet has frozen balance"
    );

  }

  // ========================================
  // Soft Delete
  // ========================================

  wallet.isDeleted = true;

  wallet.status = "blocked";

  wallet.updatedBy = userId;

  await wallet.save();

  return {

    success: true,

    message:
      "Wallet deleted successfully",

  };

};

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
  getWalletByUserId,
  getTransactionHistory,
  getWalletStatistics,

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