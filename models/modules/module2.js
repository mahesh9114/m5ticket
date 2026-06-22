import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

// ✅ configure railkit with api key
configure(process.env.RAILKIT_API_KEY);

// m2 — backwards search from stations before fromStnCode → toStnCode
// logic: if direct is waitlist, try boarding from earlier stations
async function m2(
  trainNo, // train number e.g. 12711
  fromStnCode, // from station code e.g. BZA
  toStnCode, // to station code e.g. MAS
  date, // date e.g. 22-06-2026
  coach, // coach type e.g. 2S
  quota, // quota e.g. GN
  splicedTrainArr, // array of all stations between from and to
  finding, // global finding flag
) {
  try {
    let arr = splicedTrainArr;

    // ✅ get positions of from and to in array
    const fromIndex = arr.indexOf(fromStnCode);
    const toIndex = arr.indexOf(toStnCode);
    console.log("fromIndex:", fromIndex);
    console.log("toIndex:", toIndex);

    // ✅ normalize date format "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    // ✅ step 1 — processResult defined SECOND
    function processResult(result) {
      const { fromStationName, toStationName } = result.data.train;
      const availabilityList = result.data.availability;

      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );

      console.log("match:", match);

      if (match) {
        console.log("status:", match.status);

        if (match.status === "AVAILABLE") {
          console.log(`✅ Success! ${fromStationName} -> ${toStationName}`);
          console.log(`📅 Date: ${match.date}`);
          return (true, fromStationName); // ✅ available — stop loop
        } else {
          return false; // ❌ waitlist — try next station
        }
      }

      return false; // ❌ no match
    }

    // ✅ step 2 — search function defined FIRST
    async function search(trainNo, fromStnCode, toStnCode, date, coach, quota) {
      // ✅ check cache first
      const cached = await getCache(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
      );
      if (cached) return processResult(cached);

      // ✅ call railkit api
      const result = await getAvailability(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
      );

      if (result && result.success) {
        // ✅ save to cache
        await setCache(
          trainNo,
          fromStnCode,
          toStnCode,
          date,
          coach,
          quota,
          result,
        );
        return processResult(result);
      }

      return false; // ❌ no result
    }

    // ✅ step 3 — start from station BEFORE fromStnCode and go backwards
    let index = fromIndex - 1;

    while (index >= 0) {
      const from = arr[index]; // earlier station
      console.log("trying from:", from);

      const found = await search(trainNo, from, toStnCode, date, coach, quota);
      if (found) return true; // ✅ found! stop

      index--; // ❌ try next earlier station
    }

    return false; // ❌ no earlier station worked
  } catch (err) {
    console.log("❌ M2 error:", err.message);
    return false;
  }
}

export { m2 };
