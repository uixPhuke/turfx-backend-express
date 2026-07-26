/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrator Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     BlockUserRequest:
 *       type: object
 *       required:
 *         - reason
 *       properties:
 *         reason:
 *           type: string
 *           example: Violation of community guidelines
 *
 *     ApproveOwnerRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum:
 *             - approved
 *             - rejected
 *         remarks:
 *           type: string
 *           example: Documents verified successfully
 */

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
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
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
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
 *         description: User details fetched successfully
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/v1/admin/users/{id}/block:
 *   patch:
 *     summary: Block a user
 *     tags: [Admin]
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
 *             $ref: '#/components/schemas/BlockUserRequest'
 *     responses:
 *       200:
 *         description: User blocked successfully
 */

/**
 * @swagger
 * /api/v1/admin/users/{id}/unblock:
 *   patch:
 *     summary: Unblock a user
 *     tags: [Admin]
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
 *         description: User unblocked successfully
 */

/**
 * @swagger
 * /api/v1/admin/owners/pending:
 *   get:
 *     summary: Get pending owner applications
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Pending owner applications fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/owners/{id}/approve:
 *   patch:
 *     summary: Approve or reject owner application
 *     tags: [Admin]
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
 *             $ref: '#/components/schemas/ApproveOwnerRequest'
 *     responses:
 *       200:
 *         description: Owner application updated successfully
 */

/**
 * @swagger
 * /api/v1/admin/turfs:
 *   get:
 *     summary: Get all turfs
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Turf list fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Booking list fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Payment list fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon list fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report generated successfully
 */

/**
 * @swagger
 * /api/v1/admin/reports/bookings:
 *   get:
 *     summary: Get booking analytics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Booking analytics fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/reports/users:
 *   get:
 *     summary: Get user analytics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User analytics fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/system/health:
 *   get:
 *     summary: Get system health
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System health fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/system/cache/clear:
 *   post:
 *     summary: Clear application cache
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */

/**
 * @swagger
 * /api/v1/admin/system/queues:
 *   get:
 *     summary: Get BullMQ queue status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Queue status fetched successfully
 */

/**
 * @swagger
 * /api/v1/admin/system/socket:
 *   get:
 *     summary: Get Socket.IO status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Socket server status fetched successfully
 */