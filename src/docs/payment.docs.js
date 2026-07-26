/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreatePaymentRequest:
 *       type: object
 *       required:
 *         - bookingId
 *       properties:
 *         bookingId:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab34
 *         paymentMethod:
 *           type: string
 *           enum:
 *             - razorpay
 *             - wallet
 *             - cash
 *           example: razorpay
 *
 *     VerifyPaymentRequest:
 *       type: object
 *       required:
 *         - razorpay_order_id
 *         - razorpay_payment_id
 *         - razorpay_signature
 *       properties:
 *         razorpay_order_id:
 *           type: string
 *           example: order_Nf7T8wQ8cT
 *         razorpay_payment_id:
 *           type: string
 *           example: pay_Nf7TXkS0vP
 *         razorpay_signature:
 *           type: string
 *           example: 4d9d8f0f8e8f8e8f8e8f8e8f
 *
 *     RefundRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           example: Booking cancelled by user
 */

/**
 * @swagger
 * /api/v1/payments/create-order:
 *   post:
 *     summary: Create Razorpay payment order
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentRequest'
 *     responses:
 *       201:
 *         description: Payment order created successfully
 *       400:
 *         description: Invalid booking
 */

/**
 * @swagger
 * /api/v1/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyPaymentRequest'
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid payment signature
 */

/**
 * @swagger
 * /api/v1/payments/webhook:
 *   post:
 *     summary: Razorpay webhook
 *     tags: [Payments]
 *     description: Endpoint used by Razorpay to send payment events.
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */

/**
 * @swagger
 * /api/v1/payments/my:
 *   get:
 *     summary: Get logged-in user's payments
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User payments fetched successfully
 */

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment details fetched successfully
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /api/v1/payments/{id}/refund:
 *   post:
 *     summary: Refund payment
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       200:
 *         description: Refund initiated successfully
 *       400:
 *         description: Refund not allowed
 */

/**
 * @swagger
 * /api/v1/payments/statistics:
 *   get:
 *     summary: Payment statistics
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics fetched successfully
 */

/**
 * @swagger
 * /api/v1/payments/owner:
 *   get:
 *     summary: Get owner's payment history
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner payment history fetched successfully
 */

/**
 * @swagger
 * /api/v1/payments/{id}/invoice:
 *   get:
 *     summary: Download payment invoice
 *     tags: [Payments]
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
 *         description: Invoice downloaded successfully
 */

/**
 * @swagger
 * /api/v1/payments/status/{bookingId}:
 *   get:
 *     summary: Get payment status for a booking
 *     tags: [Payments]
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
 *         description: Payment status fetched successfully
 */