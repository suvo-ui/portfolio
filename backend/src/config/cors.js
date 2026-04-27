const PRIVATE_NETWORK_ORIGIN =
  /^https?:\/\/(?:10(?:\.\d{1,3}){3}|127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}|localhost)(?::\d+)?$/i;

const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return PRIVATE_NETWORK_ORIGIN.test(origin);
  }

  return false;
}

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error(`Origin ${origin} is not allowed by CORS`);
    error.status = 403;
    callback(error);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

export { isAllowedOrigin };
export default corsOptions;
