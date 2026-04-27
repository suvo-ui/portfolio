const requestBuckets = new Map();
let lastPruneAt = 0;

function pruneExpiredBuckets(now) {
  if (now - lastPruneAt < 60_000) {
    return;
  }

  for (const [key, bucket] of requestBuckets.entries()) {
    if (bucket.resetAt <= now) {
      requestBuckets.delete(key);
    }
  }

  lastPruneAt = now;
}

export default function createRateLimiter({
  windowMs,
  max,
  keyPrefix = "global",
  keyGenerator,
  message = "Too many requests. Please try again later.",
}) {
  return (req, res, next) => {
    const now = Date.now();
    pruneExpiredBuckets(now);

    const identifier =
      keyGenerator?.(req) ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown";
    const key = `${keyPrefix}:${identifier}`;
    const existingBucket = requestBuckets.get(key);

    const bucket =
      !existingBucket || existingBucket.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : existingBucket;

    bucket.count += 1;
    requestBuckets.set(key, bucket);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(max - bucket.count, 0)));
    res.set("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.set(
        "Retry-After",
        String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
      );
      return res.status(429).json({ error: message });
    }

    return next();
  };
}
