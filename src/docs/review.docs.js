/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review & Rating Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreateReviewRequest:
 *       type: object
 *       required:
 *         - bookingId
 *         - turfId
 *         - rating
 *         - comment
 *       properties:
 *         bookingId:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab34
 *         turfId:
 *           type: string
 *           example: 6885f8bdfbd0b90e6d12ab56
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: Excellent turf and friendly staff.
 *
 *     UpdateReviewRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 4
 *         comment:
 *           type: string
 *           example: Great experience, will visit again.
 */

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: turf
 *         schema:
 *           type: string
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
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
 *         description: Reviews fetched successfully
 */

/**
 * @swagger
 * /api/v1/reviews/my:
 *   get:
 *     summary: Get logged-in user's reviews
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User reviews fetched successfully
 */

/**
 * @swagger
 * /api/v1/reviews/turf/{turfId}:
 *   get:
 *     summary: Get reviews for a turf
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: turfId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turf reviews fetched successfully
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review fetched successfully
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   patch:
 *     summary: Update review
 *     tags: [Reviews]
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
 *             $ref: '#/components/schemas/UpdateReviewRequest'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */

/**
 * @swagger
 * /api/v1/reviews/owner:
 *   get:
 *     summary: Get reviews for owner's turfs
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner reviews fetched successfully
 */

/**
 * @swagger
 * /api/v1/reviews/{id}/reply:
 *   post:
 *     summary: Reply to a review
 *     tags: [Reviews]
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
 *             type: object
 *             required:
 *               - reply
 *             properties:
 *               reply:
 *                 type: string
 *                 example: Thank you for your valuable feedback!
 *     responses:
 *       200:
 *         description: Reply added successfully
 */

/**
 * @swagger
 * /api/v1/reviews/statistics:
 *   get:
 *     summary: Get review statistics
 *     tags: [Reviews]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Review statistics fetched successfully
 */