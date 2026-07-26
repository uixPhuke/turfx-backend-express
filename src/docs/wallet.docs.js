/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     AddMoneyRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           example: 500
 *         paymentMethod:
 *           type: string
 *           enum:
 *             - razorpay
 *           example: razorpay
 *
 *     WithdrawRequest:
 *       type: object
 *       required:
 *         - amount
 *       properties:
 *         amount:
 *           type: number
 *           example: 1000
 *         accountNumber:
 *           type: string
 *           example: "123456789012"
 *         ifsc:
 *           type: string
 *           example: SBIN0001234
 *         accountHolderName:
 *           type: string
 *           example: Ruhon Borah
 *
 *     WalletTransactionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Wallet updated successfully
 */

/**
 * @swagger
 * /api/v1/wallet:
 *   get:
 *     summary: Get wallet details
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet fetched successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance fetched successfully
 */

/**
 * @swagger
 * /api/v1/wallet/add-money:
 *   post:
 *     summary: Add money to wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMoneyRequest'
 *     responses:
 *       201:
 *         description: Wallet recharge initiated
 *       400:
 *         description: Invalid amount
 */

/**
 * @swagger
 * /api/v1/wallet/withdraw:
 *   post:
 *     summary: Withdraw wallet balance
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WithdrawRequest'
 *     responses:
 *       200:
 *         description: Withdrawal request created
 *       400:
 *         description: Insufficient balance
 */

/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum:
 *             - credit
 *             - debit
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction history fetched successfully
 */

/**
 * @swagger
 * /api/v1/wallet/transactions/{id}:
 *   get:
 *     summary: Get wallet transaction details
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction fetched successfully
 *       404:
 *         description: Transaction not found
 */

/**
 * @swagger
 * /api/v1/wallet/refund/{bookingId}:
 *   post:
 *     summary: Refund booking amount to wallet
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 */

/**
 * @swagger
 * /api/v1/wallet/cashback:
 *   get:
 *     summary: Get cashback history
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cashback history fetched successfully
 */

/**
 * @swagger
 * /api/v1/wallet/statistics:
 *   get:
 *     summary: Get wallet statistics
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet statistics fetched successfully
 */

/**
 * @swagger
 * /api/v1/wallet/admin:
 *   get:
 *     summary: Get all wallet records (Admin)
 *     tags: [Wallet]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet records fetched successfully
 */