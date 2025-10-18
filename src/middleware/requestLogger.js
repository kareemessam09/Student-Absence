const morgan = require("morgan");
const logger = require("../config/logger");

morgan.token("requestId", (req) => req.requestId || "unknown");

morgan.token("userId", (req) => req.user?.id || "anonymous");

morgan.token("responseTime", (req, res) => {
  if (!req._startTime || !res._responseTime) {
    return "-";
  }
  return `${res._responseTime - req._startTime}ms`;
});

const customFormat =
  ":requestId :userId :method :url :status :responseTime :res[content-length] - :user-agent";

const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

const devLogger = morgan("dev", { stream });

const prodLogger = morgan(customFormat, { stream });

const requestId = (req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader("X-Request-ID", req.requestId);
  next();
};

const responseTime = (req, res, next) => {
  req._startTime = Date.now();

  const originalSend = res.send;
  res.send = function (data) {
    res._responseTime = Date.now();
    return originalSend.call(this, data);
  };

  next();
};

const getLogger = () => {
  if (process.env.NODE_ENV === "production") {
    return prodLogger;
  }
  return devLogger;
};

module.exports = {
  requestLogger: getLogger(),
  requestId,
  responseTime,
};
