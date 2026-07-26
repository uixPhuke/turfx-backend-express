const xss = require("xss");

function sanitize(value) {
  if (typeof value === "string") {
    return xss(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (value && typeof value === "object") {
    Object.keys(value).forEach((key) => {
      value[key] = sanitize(value[key]);
    });
  }

  return value;
}

const xssMiddleware = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

module.exports = xssMiddleware;