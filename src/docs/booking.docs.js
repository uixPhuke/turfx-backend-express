/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreateBookingRequest:
 *       type: object
 *       required:
 *         - turf
 *         - slot
 *         - bookingDate
 *       properties:
 *         turf:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab34
 *         slot:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab35
 *         bookingDate:
 *           type: string
 *           format: date
 *           example: "2026-08-01"
 *         coupon:
 *           type: string
 *           example: SAVE200
 *         paymentMethod:
 *           type: string
 *           enum:
 *             - razorpay
 *             - wallet
 *             - cash
 *           example: razorpay
 *
 *     CancelBookingRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           example: Change of plans
 *
 *     BookingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Booking created successfully
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a booking
 *     description: Book a turf slot
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Slot unavailable or validation failed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Bookings]
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
 *         name: bookingStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookings fetched successfully
 */

/**
 * @swagger
 * /api/v1/bookings/my:
 *   get:
 *     summary: Get logged-in user's bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User bookings fetched successfully
 */

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
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
 *         description: Booking fetched successfully
 *       404:
 *         description: Booking not found
 */

/**
 * @swagger
 * /api/v1/bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel booking
 *     tags: [Bookings]
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
 *             $ref: '#/components/schemas/CancelBookingRequest'
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Booking cannot be cancelled
 */

/**
 * @swagger
 * /api/v1/bookings/{id}/confirm:
 *   patch:
 *     summary: Confirm booking
 *     tags: [Bookings]
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
 *         description: Booking confirmed successfully
 */

/**
 * @swagger
 * /api/v1/bookings/{id}/complete:
 *   patch:
 *     summary: Complete booking
 *     tags: [Bookings]
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
 *         description: Booking completed successfully
 */

/**
 * @swagger
 * /api/v1/bookings/{id}/invoice:
 *   get:
 *     summary: Download booking invoice
 *     tags: [Bookings]
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
 *         description: Invoice generated successfully
 */

/**
 * @swagger
 * /api/v1/bookings/owner:
 *   get:
 *     summary: Get owner's bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner bookings fetched successfully
 */

/**
 * @swagger
 * /api/v1/bookings/statistics:
 *   get:
 *     summary: Booking statistics
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics fetched successfully
 */