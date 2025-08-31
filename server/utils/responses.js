function responseMiddleware(req, res, next) {
  res.success = function success(data, status = 200) {
    return res.status(status).json(data);
  };

  res.created = function created(data) {
    return res.status(201).json(data);
  };

  res.noContent = function noContent() {
    return res.sendStatus(204);
  };

  res.fail = function fail(status, message, details) {
    const payload = { error: message };
    if (details !== undefined) payload.details = details;
    return res.status(status).json(payload);
  };

  next();
}

module.exports = responseMiddleware;
