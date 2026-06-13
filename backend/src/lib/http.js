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
    // RUNTIME TRACE: Log HttpError details for debugging
    if (error.message.includes("Media upload body is required")) {
      console.error("=== HTTP ERROR CAUGHT: Media upload body is required ===");
      console.error("Stack trace:", error.stack);
      console.error("=== END HTTP ERROR ===\n");
    }
    return res.status(error.status).json({ error: error.message });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}
