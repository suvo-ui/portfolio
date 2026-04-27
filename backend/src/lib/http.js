export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isHttpError(error) {
  return error instanceof HttpError;
}

export function sendRouteError(res, error, fallbackMessage) {
  if (isHttpError(error)) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}
