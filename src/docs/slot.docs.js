/**
 * @swagger
 * tags:
 *   name: Slots
 *   description: Turf Slot Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreateSlotRequest:
 *       type: object
 *       required:
 *         - turf
 *         - date
 *         - startTime
 *         - endTime
 *         - price
 *       properties:
 *         turf:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab34
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-08-01"
 *         startTime:
 *           type: string
 *           example: "18:00"
 *         endTime:
 *           type: string
 *           example: "19:00"
 *         price:
 *           type: number
 *           example: 800
 *
 *     UpdateSlotRequest:
 *       type: object
 *       properties:
 *         startTime:
 *           type: string
 *           example: "19:00"
 *         endTime:
 *           type: string
 *           example: "20:00"
 *         price:
 *           type: number
 *           example: 900
 *         status:
 *           type: string
 *           enum:
 *             - available
 *             - booked
 *             - blocked
 *             - unavailable
 */

/**
 * @swagger
 * /api/v1/slots:
 *   post:
 *     summary: Create a slot
 *     tags: [Slots]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSlotRequest'
 *     responses:
 *       201:
 *         description: Slot created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/slots:
 *   get:
 *     summary: Get all slots
 *     tags: [Slots]
 *     parameters:
 *       - in: query
 *         name: turf
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot list fetched successfully
 */

/**
 * @swagger
 * /api/v1/slots/{id}:
 *   get:
 *     summary: Get slot by ID
 *     tags: [Slots]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Slot fetched successfully
 *       404:
 *         description: Slot not found
 */

/**
 * @swagger
 * /api/v1/slots/{id}:
 *   patch:
 *     summary: Update slot
 *     tags: [Slots]
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
 *             $ref: '#/components/schemas/UpdateSlotRequest'
 *     responses:
 *       200:
 *         description: Slot updated successfully
 *       404:
 *         description: Slot not found
 */

/**
 * @swagger
 * /api/v1/slots/{id}:
 *   delete:
 *     summary: Delete slot
 *     tags: [Slots]
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
 *         description: Slot deleted successfully
 *       404:
 *         description: Slot not found
 */

/**
 * @swagger
 * /api/v1/slots/available:
 *   get:
 *     summary: Get available slots
 *     tags: [Slots]
 *     parameters:
 *       - in: query
 *         name: turf
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available slots fetched successfully
 */

/**
 * @swagger
 * /api/v1/slots/block/{id}:
 *   patch:
 *     summary: Block a slot
 *     tags: [Slots]
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
 *         description: Slot blocked successfully
 */

/**
 * @swagger
 * /api/v1/slots/unblock/{id}:
 *   patch:
 *     summary: Unblock a slot
 *     tags: [Slots]
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
 *         description: Slot unblocked successfully
 */

/**
 * @swagger
 * /api/v1/slots/bulk:
 *   post:
 *     summary: Create multiple slots
 *     tags: [Slots]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Slots created successfully
 */