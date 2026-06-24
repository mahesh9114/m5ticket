import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

async function m1(
  trainNo,
  fromStnCode,
  toStnCode,
  date,
  coach,
  quota,
  finding,
) {
  try {
    // ✅ step 1 — processResult defined FIRST at top
    function processResult(result) {
      const { fromStationName, toStationName } = result.data.train;

      const normalizeDate = (d) => {
        // Checks if the date starts with a 4-digit year (e.g., 2026-06-29)
        if (d.includes("-") && d.split("-")[0].length === 4) {
          const [year, month, day] = d.split("-");
          return `${parseInt(day)}-${parseInt(month)}-${year}`; // Returns "29-6-2026"
        }

        // Fallback: If it already arrives as DD-MM-YYYY
        const [day, month, year] = d.split("-");
        return `${parseInt(day)}-${parseInt(month)}-${year}`;
      };

      const normalizedDate = normalizeDate(date);

      const { trainNo, trainName } = result.data.train;

      const availabilityList = result.data.availability;
      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );

      console.log("match:", match);

      if (match) {
        console.log("status:", match.status);
        if (match.status === "AVAILABLE") {
          console.log(`✅ Direct ticket found!`);
          console.log(`🎟️  ${fromStationName} -> ${toStationName}`);
          console.log(`📅 Date: ${match.date}`);
          return {
            bookFrom: fromStationName,
            bookUpTo: toStationName,
            trainNo: trainNo,
            trainName: trainName,
          }; // ✅ found
        } else {
          console.log(`❌ Status: "${match.status}" — not available`);
          return false; // ❌ not available
        }
      }
      return false; // ❌ no match
    }

    // ✅ step 2 — check cache
    const cached = await getCache(
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    );
    if (cached) return processResult(cached);

    const result = await getAvailability(
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    );
    // ✅ step 3 — call api

    // ✅ step 4 — save to cache and process
    if (result && result.success) {
      await setCache(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        result,
      );
      return processResult(result); // ✅ now works!
    }

    return false; // ❌ no result
  } catch (error) {
    console.log("❌ M1 error:", error.message);
    return false;
  }
}

export { m1 };
