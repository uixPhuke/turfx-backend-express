const express = require("express");
const errorHandler = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/error.middleware");


const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to TurfX API ",
  });
});

app.use(notFound);
app.use(errorHandler);
module.exports = app;