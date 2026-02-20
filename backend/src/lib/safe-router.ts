import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";

function isAsyncFunction(handler: unknown): handler is (req: Request, res: Response, next: NextFunction) => Promise<unknown> {
  return typeof handler === "function" && handler.constructor.name === "AsyncFunction";
}

function wrapAsyncHandler(handler: RequestHandler): RequestHandler {
  if (!isAsyncFunction(handler)) return handler;

  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function createSafeRouter() {
  const router = Router();
  const methods = ["get", "post", "put", "patch", "delete"] as const;

  for (const method of methods) {
    const original = router[method].bind(router);
    (router as unknown as Record<string, unknown>)[method] = ((...args: unknown[]) => {
      const [path, ...handlers] = args as [string, ...RequestHandler[]];
      const wrappedHandlers = handlers.map((handler) => wrapAsyncHandler(handler));
      return original(path, ...wrappedHandlers);
    }) as unknown;
  }

  return router;
}
