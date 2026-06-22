import Valkey from "iovalkey";

// ✅ connect to valkey
const valkey = new Valkey({
  host: "127.0.0.1",
  port: 6379,
});

// ✅ wrap connection in a promise so we can await it
export function connectValkey() {
  return new Promise((resolve, reject) => {
    valkey.on("connect", () => {
      console.log("✅ Valkey connected");
      resolve();
    });
    valkey.on("error", (err) => {
      console.log("❌ Valkey error:", err.message);
      reject(err);
    });
  });
}

// ✅ generate unique cache key from search params
function cacheKey(trainNo, fromStnCode, toStnCode, date, coach, quota) {
  return `ticket:${trainNo}:${fromStnCode}:${toStnCode}:${date}:${coach}:${quota}`;
}

// ✅ save response to cache (expires in 5 minutes)
async function setCache(
  trainNo,
  fromStnCode,
  toStnCode,
  date,
  coach,
  quota,
  data,
) {
  const key = cacheKey(trainNo, fromStnCode, toStnCode, date, coach, quota);
  await valkey.set(key, JSON.stringify(data), "EX", 300); // 300 seconds = 5 mins
  console.log(`💾 Cached: ${key}`);
}

// ✅ get response from cache
async function getCache(trainNo, fromStnCode, toStnCode, date, coach, quota) {
  const key = cacheKey(trainNo, fromStnCode, toStnCode, date, coach, quota);
  const cached = await valkey.get(key);

  if (cached) {
    console.log(`⚡ Cache hit: ${key}`);
    return JSON.parse(cached); // ✅ return parsed object
  }

  console.log(`❌ Cache miss: ${key}`);
  return null; // ❌ not in cache
}

export { valkey, setCache, getCache };
