/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Ruhon Borah
 *         phone:
 *           type: string
 *           example: "9876543210"
 *         gender:
 *           type: string
 *           enum:
 *             - male
 *             - female
 *             - other
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           example: "2001-05-15"
 *
 *     AddressRequest:
 *       type: object
 *       properties:
 *         state:
 *           type: string
 *           example: Assam
 *         city:
 *           type: string
 *           example: Jorhat
 *         area:
 *           type: string
 *           example: Garamur
 *         pincode:
 *           type: string
 *           example: "785007"
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           example: Password@123
 *         newPassword:
 *           type: string
 *           example: NewPassword@123
 */

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/users/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/v1/users/avatar:
 *   patch:
 *     summary: Update profile avatar
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 */

/**
 * @swagger
 * /api/v1/users/address:
 *   patch:
 *     summary: Update user address
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressRequest'
 *     responses:
 *       200:
 *         description: Address updated successfully
 */

/**
 * @swagger
 * /api/v1/users/change-password:
 *   patch:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid password
 */

/**
 * @swagger
 * /api/v1/users/delete-account:
 *   delete:
 *     summary: Delete logged-in user account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/users/owner/apply:
 *   post:
 *     summary: Apply for owner account
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner application submitted successfully
 */

/**
 * @swagger
 * /api/v1/users/owner/status:
 *   get:
 *     summary: Get owner application status
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Owner application status fetched
 */