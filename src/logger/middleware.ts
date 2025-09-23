import { Request, Response, NextFunction } from "express";
import { accessLogger, responseLogger, errorLogger } from "./logger";

// Capture request start time
export const logRequest = (req: Request, res: Response, next: NextFunction) => {
  (req as any)._startTime = Date.now();

  accessLogger.info({
    type: "request",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.body,
    ip: req.ip,
  });

  next();
};

// Capture response
export const logResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send.bind(res);

  res.send = (body?: any): Response => {
    const duration = Date.now() - (req as any)._startTime;

    responseLogger.info({
      type: "response",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTimeMs: duration,
      responseBody: body,
    });

    return originalSend(body);
  };

  next();
};

// Global error handler
export const logError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  errorLogger.error({
    type: "error",
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode: res.statusCode || 500,
    request: {
      headers: req.headers,
      query: req.query,
      body: req.body,
      params: req.params,
    },
  });

  res.status(500).json({ error: "Internal Server Error" });
};
