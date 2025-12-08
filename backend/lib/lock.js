// lib/lock.js
const redis = require("./redisClient");

/**
 * key - e.g. slot:{providerId}:{startAtISO}
 * value - holdToken
 * ttlSeconds - hold TTL
 */
async function setSlotLock(key, value, ttlSeconds) {
  const res = await redis.set(key, value, "NX", "EX", ttlSeconds);
  return res === "OK";
}

async function getSlotLock(key) {
  return await redis.get(key);
}

async function delSlotLock(key) {
  return await redis.del(key);
}

module.exports = { setSlotLock, getSlotLock, delSlotLock };
