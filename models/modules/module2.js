import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

// M2 — Earlier boarding station search
// If no direct seat is available from fromStnCode, this walks backwards through
// the stations before it (within splicedTrainArr) and tries each one as the booking origin.
// The user still physically boards at fromStnCode — the ticket just starts earlier.
// Returns { trainNo, trainName, bookFrom } if found, false otherwise.
async function m2(
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
          bookFrom: fromStationName, // the earlier station the ticket is booked from
        };
      }

      // Seat exists for this date but isn't open — keep trying earlier stations
      return false;
    }

    // Checks cache then API for availability between a candidate earlier station and toStnCode.
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

    // Walk backwards from the station just before fromStnCode toward the start of the array.
    // Stop as soon as any earlier station returns an available seat.
    let index = fromIndex - 1;
    while (index >= 0) {
      const earlierStation = arr[index];
      console.log("trying from:", earlierStation);

      const found = await search(
        trainNo,
        earlierStation,
        toStnCode,
        date,
        coach,
        quota,
      );
      if (found) return found; // Available seat found — stop searching

      index--; // No luck — try the next earlier station
    }

    return false; // Exhausted all earlier stations with no availability
  } catch (err) {
    console.log("❌ M2 error:", err.message);
    return false;
  }
}

export { m2 };
