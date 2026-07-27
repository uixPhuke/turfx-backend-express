const mongoose = require("mongoose");

// ==========================================
// Wallet Transaction Schema
// ==========================================

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "credit",
        "debit",
        "refund",
        "cashback",
        "reward",
        "booking_payment",
        "withdraw",
        "admin_credit",
        "admin_debit",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "completed",
    },

    transactionId: {
      type: String,
      default: null,
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

// ==========================================
// Wallet Schema
// ==========================================

const walletSchema = new mongoose.Schema(
  {
    // ======================================
    // User
    // ======================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ======================================
    // Balance
    // ======================================

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Currency
    // ======================================

    currency: {
      type: String,
      enum: [
        "INR",
        "USD",
        "EUR",
        "GBP",
      ],
      default: "INR",
    },

    // ======================================
    // Wallet Status
    // ======================================

    status: {
      type: String,
      enum: [
        "active",
        "frozen",
        "blocked",
      ],
      default: "active",
      index: true,
    },
        // ======================================
    // Transaction History
    // ======================================

    transactions: {
      type: [transactionSchema],
      default: [],
    },

    // ======================================
    // Frozen Balance
    // ======================================

    frozenBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Total Credited
    // ======================================

    totalCredited: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Total Debited
    // ======================================

    totalDebited: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Total Cashback
    // ======================================

    totalCashback: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Total Refund
    // ======================================

    totalRefund: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Reward Points
    // ======================================

    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ======================================
    // Withdrawal Settings
    // ======================================

    withdrawalEnabled: {
      type: Boolean,
      default: false,
    },

    minimumWithdrawalAmount: {
      type: Number,
      default: 500,
      min: 0,
    },

    // ======================================
    // Soft Delete
    // ======================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ======================================
    // Last Transaction
    // ======================================

    lastTransactionAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ======================================
    // Last Updated By
    // ======================================

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
      },
  {
    timestamps: true,
    versionKey: false,
  }
);


// ==========================================
// Virtuals
// ==========================================

walletSchema.virtual("availableBalance").get(
  function () {

    return Math.max(
      0,
      this.balance - this.frozenBalance
    );

  }
);

walletSchema.virtual("transactionCount").get(
  function () {

    return this.transactions.length;

  }
);

// ==========================================
// Instance Methods
// ==========================================

// Credit Wallet

walletSchema.methods.credit =
  async function (transaction) {

    const balanceBefore =
      this.balance;

    this.balance += transaction.amount;

    this.totalCredited +=
      transaction.amount;

    if (
      transaction.type ===
      "cashback"
    ) {

      this.totalCashback +=
        transaction.amount;

    }

    if (
      transaction.type ===
      "refund"
    ) {

      this.totalRefund +=
        transaction.amount;

    }

    this.transactions.push({

      ...transaction,

      balanceBefore,

      balanceAfter:
        this.balance,

    });

    this.lastTransactionAt =
      new Date();

    await this.save();

    return this;

  };

// Debit Wallet

walletSchema.methods.debit =
  async function (transaction) {

    if (
      this.availableBalance <
      transaction.amount
    ) {

      throw new Error(
        "Insufficient wallet balance"
      );

    }

    const balanceBefore =
      this.balance;

    this.balance -= transaction.amount;

    this.totalDebited +=
      transaction.amount;

    this.transactions.push({

      ...transaction,

      balanceBefore,

      balanceAfter:
        this.balance,

    });

    this.lastTransactionAt =
      new Date();

    await this.save();

    return this;

  };

// ==========================================
// Static Methods
// ==========================================

// Get Or Create Wallet

walletSchema.statics.getOrCreateWallet =
  async function (userId) {

    let wallet =
      await this.findOne({

        user: userId,

        isDeleted: false,

      });

    if (!wallet) {

      wallet =
        await this.create({

          user: userId,

        });

    }

    return wallet;

  };

// ==========================================
// Middleware
// ==========================================

walletSchema.pre("save", function () {
  if (this.balance < 0) {
    this.balance = 0;
  }

  if (this.frozenBalance < 0) {
    this.frozenBalance = 0;
  }
});

// ==========================================
// JSON Options
// ==========================================

walletSchema.set(
  "toJSON",
  {
    virtuals: true,
  }
);

walletSchema.set(
  "toObject",
  {
    virtuals: true,
  }
);

// ==========================================
// Export
// ==========================================

module.exports =
  mongoose.model(
    "Wallet",
    walletSchema
  );