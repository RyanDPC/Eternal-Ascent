const { v4: uuidv4 } = require('uuid');
const pinoHttp = require('pino-http');
const logger = require('../services/Logger');

const httpLogger = pinoHttp({ logger });

function requestContext(req, res, next) {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  httpLogger(req, res);
  next();
}

module.exports = requestContext;

