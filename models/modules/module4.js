import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

// M4 — Split ticket search via middle stations
// If no single seat covers fromStnCode → toStnCode, this tries every station
// between them as a split point (midStation). Both legs must be AVAILABLE:
//   Leg 1: fromStnCode → midStation
//   Leg 2: midStation  → toStnCode
// The user changes seat at midStation but stays on the same train.
// Returns { trainNo, trainName, bookFrom, midStation, bookUpTo } if found, false otherwise.
async function m4(
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

    // Find where source and destination sit in the station list
    const fromIndex = arr.indexOf(fromStnCode);
    const toIndex = arr.indexOf(toStnCode);

    // Extract only the stations strictly between from and to — these are the candidate split points
    const midStations = arr.slice(fromIndex + 1, toIndex);
    console.log("fromIndex + 1:", fromIndex + 1);
    console.log("toIndex:", toIndex);
    console.log("midStations:", midStations);
    console.log("midStations.length:", midStations.length);

    // Strip leading zeros from day and month to match the API's date key format
    // e.g. "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    // Checks a single API result for availability on the requested date.
    // M4 only needs a boolean — it doesn't extract ticket details here (done in the return below).
    // Returns true if the leg is AVAILABLE, false if waitlisted or date not found.
    function processResult(result) {
      const availabilityList = result.data.availability;
      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );
      console.log("match:", match);

      if (!match) return false; // No entry for this date in the response

      console.log("status:", match.status);

      if (match.status === "AVAILABLE") {
        const { fromStationName, toStationName } = result.data.train;
        console.log(`✅ ${fromStationName} -> ${toStationName}`);
        return true; // This leg has an open seat
      }

      return false; // Seat exists but is waitlisted or closed
    }

    // Checks cache then API for availability between two stations.
    // Returns true/false via processResult — no ticket details needed at this stage.
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

    // Try each station between from and to as a potential split point.
    // For each candidate, check leg 1 first — only call the API for leg 2 if leg 1 passes.
    // This avoids unnecessary API calls when leg 1 is already unavailable.
    let index = 0;
    while (index <= midStations.length - 1) {
      const midStation = midStations[index];
      console.log("midStation:", midStation);

      // Leg 1: can we get from the source to this mid station?
      const leg1Available = await search(
        trainNo,
        fromStnCode,
        midStation,
        date,
        coach,
        quota,
      );

      if (leg1Available) {
        // Leg 1 is open — now check if leg 2 is also available
        const leg2Available = await search(
          trainNo,
          midStation,
          toStnCode,
          date,
          coach,
          quota,
        );

        if (leg2Available) {
          // Both legs open — valid split ticket found
          console.log("\n🎉 Split Ticket Found!");
          console.log(`🎟️  Ticket 1: ${fromStnCode} → ${midStation}`);
          console.log(`🎟️  Ticket 2: ${midStation} → ${toStnCode}`);
          console.log(`📅 Date: ${date}`);

          return {
            trainNo,
            trainName: arr.trainName, // propagated from splicedTrainArr context
            bookFrom: fromStnCode, // start of leg 1 (user's boarding station)
            midStation: midStation, // where the user changes seat between legs
            bookUpTo: toStnCode, // end of leg 2 (user's destination)
          };
        }
        // Leg 2 unavailable at this mid point — try the next candidate
      }

      index++; // Move to the next potential split point
    }

    return false; // No mid station produced two available legs
  } catch (err) {
    console.log("❌ M4 error:", err.message);
    return false;
  }
}

export { m4 };
