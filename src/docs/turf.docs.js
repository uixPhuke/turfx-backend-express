/**
 * @swagger
 * tags:
 *   name: Turfs
 *   description: Turf Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     CreateTurfRequest:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - address
 *         - sportType
 *         - pricePerHour
 *       properties:
 *         name:
 *           type: string
 *           example: Green Valley Turf
 *         description:
 *           type: string
 *           example: Premium 7A side football turf
 *         sportType:
 *           type: string
 *           enum:
 *             - football
 *             - cricket
 *             - badminton
 *             - tennis
 *             - basketball
 *         pricePerHour:
 *           type: number
 *           example: 1200
 *         size:
 *           type: string
 *           example: 7A Side
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - Parking
 *             - Washroom
 *             - Drinking Water
 *             - Flood Lights
 *         address:
 *           type: object
 *           properties:
 *             state:
 *               type: string
 *               example: Assam
 *             city:
 *               type: string
 *               example: Jorhat
 *             area:
 *               type: string
 *               example: Garamur
 *             pincode:
 *               type: string
 *               example: "785007"
 *
 *     UpdateTurfRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         pricePerHour:
 *           type: number
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/v1/turfs:
 *   post:
 *     summary: Create a new turf
 *     tags: [Turfs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateTurfRequest'
 *               - type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *     responses:
 *       201:
 *         description: Turf created successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/turfs:
 *   get:
 *     summary: Get all turfs
 *     tags: [Turfs]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: sportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
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
 *         description: Turf list fetched successfully
 */

/**
 * @swagger
 * /api/v1/turfs/{id}:
 *   get:
 *     summary: Get turf by ID
 *     tags: [Turfs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turf fetched successfully
 *       404:
 *         description: Turf not found
 */

/**
 * @swagger
 * /api/v1/turfs/{id}:
 *   patch:
 *     summary: Update turf
 *     tags: [Turfs]
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
 *             $ref: '#/components/schemas/UpdateTurfRequest'
 *     responses:
 *       200:
 *         description: Turf updated successfully
 *       404:
 *         description: Turf not found
 */

/**
 * @swagger
 * /api/v1/turfs/{id}:
 *   delete:
 *     summary: Delete turf
 *     tags: [Turfs]
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
 *         description: Turf deleted successfully
 *       404:
 *         description: Turf not found
 */

/**
 * @swagger
 * /api/v1/turfs/my:
 *   get:
 *     summary: Get logged in owner's turfs
 *     tags: [Turfs]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner turfs fetched successfully
 */

/**
 * @swagger
 * /api/v1/turfs/{id}/images:
 *   post:
 *     summary: Upload turf images
 *     tags: [Turfs]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */

/**
 * @swagger
 * /api/v1/turfs/{id}/status:
 *   patch:
 *     summary: Activate or deactivate a turf
 *     tags: [Turfs]
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
 *         description: Turf status updated successfully
 */

/**
 * @swagger
 * /api/v1/turfs/nearby:
 *   get:
 *     summary: Find nearby turfs
 *     tags: [Turfs]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           example: 5
 *     responses:
 *       200:
 *         description: Nearby turfs fetched successfully
 */

/**
 * @swagger
 * /api/v1/turfs/search:
 *   get:
 *     summary: Search turfs
 *     tags: [Turfs]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *           example: football
 *     responses:
 *       200:
 *         description: Search completed successfully
 */