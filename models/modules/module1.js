import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

// M1 — Direct ticket search
// Checks if a seat is available exactly from fromStnCode → toStnCode on the given date.
// Returns ticket details if available, false otherwise.
async function m1(trainNo, fromStnCode, toStnCode, date, coach, quota) {
  try {
    // Parses an API result and checks whether the requested date has available seats.
    // Handles both YYYY-MM-DD (from HTML form) and DD-MM-YYYY (from API) date formats.
    function processResult(result) {
      const {
        trainNo,
        trainName,
        fromStationName,
        toStationName,
        travelClass,
      } = result.data.train;
      const availabilityList = result.data.availability;

      // If either station wasn't found in the route, abort early with a clear message
      if (travelClass !== coach) {
        return travelClass;
      }

      // The API returns availability keyed by "D-M-YYYY" (no leading zeros).
      // Normalize whatever date format arrives into that same shape for comparison.
      const normalizeDate = (d) => {
        const parts = d.split("-");

        // YYYY-MM-DD → D-M-YYYY (strip leading zeros from day and month)
        if (parts[0].length === 4) {
          const [year, month, day] = parts;
          return `${parseInt(day)}-${parseInt(month)}-${year}`;
        }

        // DD-MM-YYYY → D-M-YYYY (already in right order, just strip leading zeros)
        const [day, month, year] = parts;
        return `${parseInt(day)}-${parseInt(month)}-${year}`;
      };

      const normalizedDate = normalizeDate(date);

      // Find the availability entry that matches the requested date
      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );
      console.log("match:", match);

      if (!match) return false; // No entry for this date in the response

      console.log("status:", match.status);

      if (match.status === "AVAILABLE") {
        console.log(`✅ Direct ticket found!`);
        console.log(`🎟️  ${fromStationName} -> ${toStationName}`);
        console.log(`📅 Date: ${match.date}`);

        return {
          trainNo,
          trainName,
          bookFrom: fromStationName, // human-readable station name (not code)
          bookUpTo: toStationName, // human-readable station name (not code)
        };
      }

      // Date matched but seat status is not AVAILABLE (e.g. WL, REGRET)
      console.log(`❌ Status: "${match.status}" — not available`);
      return false;
    }

    // Check cache first — avoids a redundant API call if this exact query was made before
    const cached = await getCache(
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    );
    if (cached) return processResult(cached);

    // Cache miss — call the railway API for live availability
    const result = await getAvailability(
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    );

    if (result && result.success) {
      // Save the API response to cache so repeat searches don't hit the API again
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

    return false; // API returned no usable result
  } catch (error) {
    console.log("❌ M1 error:", error.message);
    return false;
  }
}

export { m1 };
