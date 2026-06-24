import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

// ✅ configure railkit with api key
configure(process.env.RAILKIT_API_KEY);

// m3 — forward search from fromStnCode → stations AFTER toStnCode
// logic: if direct is waitlist, try getting off at later stations
async function m3(
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
    let arrlen = arr.length;

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

    // ✅ step 1 — processResult defined FIRST
    function processResult(result) {
      const { fromStationName, toStationName } = result.data.train;
      const availabilityList = result.data.availability;

      const { trainNo, trainName } = result.data.train;

      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );

      console.log("match:", match);

      if (match) {
        console.log("status:", match.status);
        if (match.status === "AVAILABLE") {
          console.log(`✅ Success! ${fromStationName} -> ${toStationName}`);
          console.log(`📅 Date: ${match.date}`);
          return {
            bookUpTo: toStationName,
            trainNo: trainNo,
            trainName: trainName,
          }; // ✅ available — stop loop
        } else {
          return false; // ❌ waitlist — try next station
        }
      }
      return false; // ❌ no match
    }

    // ✅ step 2 — search function defined SECOND
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

    // ✅ step 3 — start from station AFTER toStnCode and go forwards
    let index = toIndex + 1;

    while (index <= arrlen - 1) {
      const to = arr[index]; // later station
      console.log("trying to:", to);

      const found = await search(trainNo, fromStnCode, to, date, coach, quota);
      if (found) return found; // ✅ found! stop

      index++; // ❌ try next later station
    }

    return false; // ❌ no later station worked
  } catch (err) {
    console.log("❌ M3 error:", err.message);
    return false;
  }
}

export { m3 };
