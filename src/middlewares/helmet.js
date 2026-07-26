const helmet = require("helmet");

// ==========================================
// Helmet Security Middleware
// ==========================================

const helmetMiddleware = helmet({
  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Prevent MIME type sniffing
  noSniff: true,

  // Prevent clickjacking
  frameguard: {
    action: "deny",
  },

  // Restrict browser features
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: ["self"],
      usb: [],
      fullscreen: ["self"],
    },
  },

  // Strict Referrer Policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  // HSTS (HTTPS only)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false,
  },

  // Disable Adobe Flash
  permittedCrossDomainPolicies: false,

  // Cross Origin Policies
  crossOriginEmbedderPolicy: false,

  crossOriginOpenerPolicy: {
    policy: "same-origin",
  },

  crossOriginResourcePolicy: {
    policy: "cross-origin",
  },

  // Content Security Policy
  contentSecurityPolicy: {
    useDefaults: true,

    directives: {
      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://checkout.razorpay.com",
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https:",
      ],

      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
      ],

      connectSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://res.cloudinary.com",
        "wss:",
      ],

      fontSrc: [
        "'self'",
        "https:",
        "data:",
      ],

      objectSrc: ["'none'"],

      upgradeInsecureRequests: [],
    },
  },
});

module.exports = helmetMiddleware;