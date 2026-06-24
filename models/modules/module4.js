import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

// ✅ configure railkit with api key
configure(process.env.RAILKIT_API_KEY);

// m4 — split ticket search via middle stations
// logic: search fromStnCode→midStation + midStation→toStnCode
// if both available, its a valid split ticket!
async function m4(
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

    // ✅ get positions of from and to in splicedTrainArr
    let fromIndex = arr.indexOf(fromStnCode);
    let toIndex = arr.indexOf(toStnCode);

    // ✅ get middle stations between from and to
    let mid = arr.slice(fromIndex + 1, toIndex);
    console.log("fromIndex + 1:", fromIndex + 1);
    console.log("toIndex:", toIndex);
    console.log(`midarr: ${mid}`);
    console.log("mid.length:", mid.length);

    // ✅ normalize date format "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    // ✅ step 1 — processResult defined FIRST
    function processResult(result) {
      const availabilityList = result.data.availability;
      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );

      const { trainNo, trainName } = result.data.train;

      console.log("match:", match);

      if (match) {
        console.log("status:", match.status);
        if (match.status === "AVAILABLE") {
          const { fromStationName, toStationName } = result.data.train;
          console.log(`✅ ${fromStationName} -> ${toStationName}`);
          return true; // ✅ this leg available
        } else {
          return false; // ❌ waitlist
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

    // ✅ step 3 — loop through each middle station as split point
    let index = 0;

    while (index <= mid.length - 1) {
      const midStation = mid[index]; // current split point
      console.log("midStation:", midStation);

      // ✅ FIRST SEARCH: fromStnCode → midStation
      const firstFound = await search(
        trainNo,
        fromStnCode,
        midStation,
        date,
        coach,
        quota,
      );

      if (firstFound) {
        // ✅ SECOND SEARCH: midStation → toStnCode
        const secondFound = await search(
          trainNo,
          midStation,
          toStnCode,
          date,
          coach,
          quota,
        );

        if (secondFound) {
          // ✅ BOTH LEGS FOUND
          console.log("\n🎉 Split Ticket Found!");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`🎟️  Tkt 1: ${fromStnCode} -> ${midStation}`);
          console.log(`🎟️  Tkt 2: ${midStation} -> ${toStnCode}`);
          console.log(`📅 Date: ${date}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          return {
            bookFrom: fromStnCode,
            changeseat: midStation,
            bookupto: toStnCode,
            trainNo: trainNo,
            trainName: trainName,
          }; // ✅ found! stop
        }
        // ❌ second leg not available, try next mid station
      }

      index++; // ❌ try next mid station
    }

    return false; // ❌ no valid split ticket found
  } catch (err) {
    console.log("❌ M4 error:", err.message);
    return false;
  }
}

export { m4 };
