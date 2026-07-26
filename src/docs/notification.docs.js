/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     NotificationResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab34
 *         title:
 *           type: string
 *           example: Booking Confirmed
 *         message:
 *           type: string
 *           example: Your booking has been confirmed successfully.
 *         type:
 *           type: string
 *           enum:
 *             - booking
 *             - payment
 *             - wallet
 *             - coupon
 *             - review
 *             - admin
 *             - system
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     SendNotificationRequest:
 *       type: object
 *       required:
 *         - userId
 *         - title
 *         - message
 *       properties:
 *         userId:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab34
 *         title:
 *           type: string
 *           example: Wallet Credited
 *         message:
 *           type: string
 *           example: ₹200 cashback has been credited.
 *         type:
 *           type: string
 *           enum:
 *             - booking
 *             - payment
 *             - wallet
 *             - coupon
 *             - review
 *             - admin
 *             - system
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get logged-in user's notifications
 *     tags: [Notifications]
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
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 */

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched successfully
 */

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
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
 *         description: Notification fetched successfully
 *       404:
 *         description: Notification not found
 */

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
 *         description: Notification deleted successfully
 */

/**
 * @swagger
 * /api/v1/notifications/clear:
 *   delete:
 *     summary: Delete all notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted successfully
 */

/**
 * @swagger
 * /api/v1/notifications/send:
 *   post:
 *     summary: Send notification (Admin)
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendNotificationRequest'
 *     responses:
 *       201:
 *         description: Notification sent successfully
 */

/**
 * @swagger
 * /api/v1/notifications/broadcast:
 *   post:
 *     summary: Send broadcast notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: TurfX Update
 *               message:
 *                 type: string
 *                 example: New offers are now available.
 *               type:
 *                 type: string
 *                 example: system
 *     responses:
 *       201:
 *         description: Broadcast notification queued successfully
 */

/**
 * @swagger
 * /api/v1/notifications/statistics:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics fetched successfully
 */