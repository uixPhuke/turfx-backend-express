// src/docs/swagger.js

const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "TurfX API",
      version: "1.0.0",
      description: `
# TurfX REST API

Modern Football Turf Booking Platform

## Features

- JWT Authentication
- User Management
- Owner Management
- Turf Management
- Slot Booking
- Razorpay Payment
- Wallet
- Coupon
- Review
- Notification
- Admin Panel
- Redis Cache
- BullMQ Queues
- Socket.IO

`,
      contact: {
        name: "Ruhon Borah",
        email: "rohanuix@gmail.com",
      },
    },

    servers: [
  {
    url:
      process.env.NODE_ENV === "production"
        ? process.env.API_URL ||
          "https://turfx-backend-express.onrender.com"
        : `http://localhost:${process.env.PORT || 8000}`,

    description:
      process.env.NODE_ENV === "production"
        ? "Production Server"
        : "Development Server",
  },
],

    tags: [
      {
        name: "Authentication",
      },
      {
        name: "Users",
      },
      {
        name: "Owners",
      },
      {
        name: "Turfs",
      },
      {
        name: "Slots",
      },
      {
        name: "Bookings",
      },
      {
        name: "Payments",
      },
      {
        name: "Coupons",
      },
      {
        name: "Wallet",
      },
      {
        name: "Reviews",
      },
      {
        name: "Notifications",
      },
      {
        name: "Admin",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },

      schemas: {
        ErrorResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: false,
            },

            message: {
              type: "string",
              example: "Unauthorized",
            },
          },
        },

        SuccessResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: true,
            },

            message: {
              type: "string",
              example: "Success",
            },
          },
        },
      },
    },

    security: [
      {
        BearerAuth: [],
      },
    ],
  },

  apis: [
    "./src/modules/**/*.routes.js",
    "./src/docs/*.docs.js",
  ],
};

const swaggerSpec =
  swaggerJsdoc(options);

const swaggerDocs = (app) => {
  app.use(
    "/api/docs",

    swaggerUi.serve,

    swaggerUi.setup(swaggerSpec, {
      explorer: true,

      customSiteTitle: "TurfX API Docs",

      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
};

module.exports = swaggerDocs;