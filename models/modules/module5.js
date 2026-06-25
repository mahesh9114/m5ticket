import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

// M5 — Extended split ticket search (combines M2 + M3)
// If M1–M4 all fail, this searches across a wider range: stations BEFORE fromStnCode
// paired with stations AFTER toStnCode. A single ticket spanning both extensions
// covers the user's journey — they board at fromStnCode and exit at toStnCode.
//
// Search order: starts closest to the user's stations and expands outward.
//   fromCandidates: stations before fromStnCode, traversed right → left (closest first)
//   toCandidates:   stations after toStnCode,    traversed left → right (closest first)
//
// Returns { trainNo, trainName, bookFrom, bookUpTo } if found, false otherwise.
async function m5(
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

    const fromIndex = arr.indexOf(fromStnCode);
    const toIndex = arr.indexOf(toStnCode);

    // Stations that come before the user's source — candidates for an earlier bookFrom
    const fromCandidates = arr.slice(0, fromIndex);

    // Stations that come after the user's destination — candidates for a later bookUpTo
    const toCandidates = arr.slice(toIndex + 1, arr.length);

    console.log("fromIndex:", fromIndex);
    console.log("toIndex:", toIndex);
    console.log("fromCandidates:", fromCandidates);
    console.log("toCandidates:", toCandidates);

    // Strip leading zeros from day and month to match the API's date key format
    // e.g. "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    // Checks an API result for availability on the requested date.
    // Returns full ticket details if AVAILABLE, false if waitlisted or date not found.
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
        console.log(`✅ ${fromStationName} -> ${toStationName}`);
        console.log(`📅 Date: ${match.date}`);

        return {
          trainNo,
          trainName,
          bookFrom: fromStationName, // the earlier station the ticket starts from
          bookUpTo: toStationName, // the later station the ticket ends at
        };
      }

      return false; // Seat exists but is waitlisted or closed
    }

    // Checks cache then API for availability between two stations.
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

    // Outer loop: walk backwards through fromCandidates (closest earlier station first).
    // Inner loop: for each earlier station, try every later station in toCandidates.
    // The first combination that returns an available seat wins.
    let i = fromCandidates.length - 1;
    while (i >= 0) {
      const earlierStation = fromCandidates[i];

      for (let j = 0; j < toCandidates.length; j++) {
        const laterStation = toCandidates[j];
        console.log(`trying: ${earlierStation} → ${laterStation}`);

        const found = await search(
          trainNo,
          earlierStation,
          laterStation,
          date,
          coach,
          quota,
        );

        if (found) {
          console.log("\n🎉 Extended Ticket Found!");
          console.log(`🎟️  ${earlierStation} → ${laterStation}`);
          console.log(`📅 Date: ${date}`);
          return found; // Return the full ticket details from processResult
        }
      }

      i--; // No combination worked for this earlier station — move further back
    }

    return false; // Exhausted all from/to combinations with no availability
  } catch (err) {
    console.log("❌ M5 error:", err.message);
    return false;
  }
}

export { m5 };
