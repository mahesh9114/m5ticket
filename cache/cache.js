import Valkey from "iovalkey";

// Create a Valkey client pointed at the local instance.
// All modules share this single connection via the exported `valkey` instance.
const valkey = new Valkey({
  host: "127.0.0.1",
  port: 6379,
});

// Wraps the Valkey connection event in a promise so the app can await it
// at startup before handling any requests.
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

// Builds a deterministic cache key from all search parameters.
// Every unique combination of train + route + date + class + quota gets its own key.
// Format: "ticket:trainNo:from:to:date:coach:quota"
function cacheKey(trainNo, fromStnCode, toStnCode, date, coach, quota) {
  return `ticket:${trainNo}:${fromStnCode}:${toStnCode}:${date}:${coach}:${quota}`;
}

// Serialises and stores an API response in Valkey with a 15-minute expiry.
// Prevents repeat API calls for the same search within the same session window.
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
  await valkey.set(key, JSON.stringify(data), "EX", 900); // 900 seconds = 15 minutes
  console.log(`💾 Cached: ${key}`);
}

// Retrieves a cached API response for the given search params.
// Returns the parsed object if found, null if the key doesn't exist or has expired.
async function getCache(trainNo, fromStnCode, toStnCode, date, coach, quota) {
  const key = cacheKey(trainNo, fromStnCode, toStnCode, date, coach, quota);
  const cached = await valkey.get(key);

  if (cached) {
    console.log(`⚡ Cache hit: ${key}`);
    return JSON.parse(cached); // Deserialise back to the original API response shape
  }

  console.log(`❌ Cache miss: ${key}`);
  return null; // Caller should fall through to a live API request
}

export { valkey, setCache, getCache };
