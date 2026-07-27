class ApiResponse {
  constructor(
    statusCode,
    data = null,
    message = "Success"
  ) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
  }

  static success(
    res,
    message = "Success",
    data = null,
    statusCode = 200
  ) {
    return res.status(statusCode).json(
      new ApiResponse(
        statusCode,
        data,
        message
      )
    );
  }

  static created(
    res,
    message = "Created successfully",
    data = null
  ) {
    return res.status(201).json(
      new ApiResponse(
        201,
        data,
        message
      )
    );
  }
}

module.exports = ApiResponse;