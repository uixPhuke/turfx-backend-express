/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupon Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreateCouponRequest:
 *       type: object
 *       required:
 *         - code
 *         - title
 *         - type
 *         - value
 *         - validFrom
 *         - validUntil
 *       properties:
 *         code:
 *           type: string
 *           example: SAVE200
 *         title:
 *           type: string
 *           example: Flat ₹200 OFF
 *         description:
 *           type: string
 *           example: Flat discount on football bookings
 *         type:
 *           type: string
 *           enum:
 *             - percentage
 *             - flat
 *             - cashback
 *             - free_booking
 *             - first_booking
 *         value:
 *           type: number
 *           example: 200
 *         minimumBookingAmount:
 *           type: number
 *           example: 1000
 *         maximumDiscount:
 *           type: number
 *           example: 500
 *         usageLimit:
 *           type: number
 *           example: 500
 *         usagePerUser:
 *           type: number
 *           example: 1
 *         validFrom:
 *           type: string
 *           format: date-time
 *         validUntil:
 *           type: string
 *           format: date-time
 *         isGlobal:
 *           type: boolean
 *           example: true
 *         applicableTurfs:
 *           type: array
 *           items:
 *             type: string
 *
 *     UpdateCouponRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         value:
 *           type: number
 *         minimumBookingAmount:
 *           type: number
 *         maximumDiscount:
 *           type: number
 *         usageLimit:
 *           type: number
 *         validUntil:
 *           type: string
 *           format: date-time
 *         isActive:
 *           type: boolean
 *
 *     ValidateCouponRequest:
 *       type: object
 *       required:
 *         - code
 *         - bookingAmount
 *       properties:
 *         code:
 *           type: string
 *           example: SAVE200
 *         bookingAmount:
 *           type: number
 *           example: 1500
 */

/**
 * @swagger
 * /api/v1/coupons:
 *   post:
 *     summary: Create a coupon
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCouponRequest'
 *     responses:
 *       201:
 *         description: Coupon created successfully
 */

/**
 * @swagger
 * /api/v1/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isGlobal
 *         schema:
 *           type: boolean
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
 *         description: Coupons fetched successfully
 */

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   get:
 *     summary: Get coupon by ID
 *     tags: [Coupons]
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
 *         description: Coupon fetched successfully
 *       404:
 *         description: Coupon not found
 */

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   patch:
 *     summary: Update coupon
 *     tags: [Coupons]
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
 *             $ref: '#/components/schemas/UpdateCouponRequest'
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 */

/**
 * @swagger
 * /api/v1/coupons/{id}:
 *   delete:
 *     summary: Delete coupon
 *     tags: [Coupons]
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
 *         description: Coupon deleted successfully
 */

/**
 * @swagger
 * /api/v1/coupons/validate:
 *   post:
 *     summary: Validate coupon
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponRequest'
 *     responses:
 *       200:
 *         description: Coupon validated successfully
 *       400:
 *         description: Invalid or expired coupon
 */

/**
 * @swagger
 * /api/v1/coupons/apply:
 *   post:
 *     summary: Apply coupon to booking
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateCouponRequest'
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 */

/**
 * @swagger
 * /api/v1/coupons/my:
 *   get:
 *     summary: Get owner's coupons
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner coupons fetched successfully
 */

/**
 * @swagger
 * /api/v1/coupons/active:
 *   get:
 *     summary: Get active coupons
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: Active coupons fetched successfully
 */

/**
 * @swagger
 * /api/v1/coupons/{id}/activate:
 *   patch:
 *     summary: Activate coupon
 *     tags: [Coupons]
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
 *         description: Coupon activated successfully
 */

/**
 * @swagger
 * /api/v1/coupons/{id}/deactivate:
 *   patch:
 *     summary: Deactivate coupon
 *     tags: [Coupons]
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
 *         description: Coupon deactivated successfully
 */

/**
 * @swagger
 * /api/v1/coupons/statistics:
 *   get:
 *     summary: Get coupon statistics
 *     tags: [Coupons]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon statistics fetched successfully
 */