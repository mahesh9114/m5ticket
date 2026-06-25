import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

// M3 — Later alighting station search
// If no direct seat is available to toStnCode, this walks forwards through
// the stations after it (within splicedTrainArr) and tries each one as the booking destination.
// The user still physically exits at toStnCode — the ticket just extends further.
// Returns { trainNo, trainName, bookUpTo } if found, false otherwise.
async function m3(
  trainNo,
  fromStnCode,
  toStnCode,
  date,
  coach,
  quota,
  splicedTrainArr,
) {
  try {
    const arr = splicedTrainArr;
    const arrLen = arr.length;

    // Find where the user's source and destination sit in the station list
    const fromIndex = arr.indexOf(fromStnCode);
    const toIndex = arr.indexOf(toStnCode);
    console.log("fromIndex:", fromIndex);
    console.log("toIndex:", toIndex);

    // Strip leading zeros from day and month to match the API's date key format
    // e.g. "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    // Checks an API result for availability on the requested date.
    // Returns ticket details if the seat is AVAILABLE, false if waitlisted or not found.
    function processResult(result) {
      const { trainNo, trainName, fromStationName, toStationName } =
        result.data.train;
      const availabilityList = result.data.availability;

      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );
      console.log("match:", match);

      if (!match) return false; // No entry for this date in the response

      console.log("status:", match.status);

      if (match.status === "AVAILABLE") {
        console.log(`✅ Success! ${fromStationName} -> ${toStationName}`);
        console.log(`📅 Date: ${match.date}`);

        return {
          trainNo,
          trainName,
          bookUpTo: toStationName, // the later station the ticket is booked up to
        };
      }

      // Seat exists for this date but isn't open — keep trying later stations
      return false;
    }

    // Checks cache then API for availability between fromStnCode and a candidate later station.
    // Saves successful API responses to cache to avoid repeat calls.
    async function search(trainNo, fromStnCode, toStnCode, date, coach, quota) {
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
        return processResult(result);
      }

      return false; // API returned no usable result
    }

    // Walk forwards from the station just after toStnCode toward the end of the array.
    // Stop as soon as any later station returns an available seat.
    let index = toIndex + 1;
    while (index <= arrLen - 1) {
      const laterStation = arr[index];
      console.log("trying to:", laterStation);

      const found = await search(
        trainNo,
        fromStnCode,
        laterStation,
        date,
        coach,
        quota,
      );
      if (found) return found; // Available seat found — stop searching

      index++; // No luck — try the next later station
    }

    return false; // Exhausted all later stations with no availability
  } catch (err) {
    console.log("❌ M3 error:", err.message);
    return false;
  }
}

export { m3 };
