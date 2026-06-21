import "dotenv/config";
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

    // ✅ get positions of from and to in array
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
    const normalizedDate = normalizeDate(date); // normalize once outside loop

    let index = 0;

    // ✅ loop through each middle station as split point
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
        // ✅ SECOND SEARCH: midStation → toStnCode (only if first found)
        const secondFound = await search(
          trainNo,
          midStation,
          toStnCode,
          date,
          coach,
          quota,
        );

        if (secondFound) {
          // ✅ BOTH LEGS FOUND — display split ticket
          console.log("\n🎉 Split Ticket Found!");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`🎟️  Tkt 1: ${fromStnCode} -> ${midStation}`);
          console.log(`🎟️  Tkt 2: ${midStation} -> ${toStnCode}`);
          console.log(`📅 Date: ${date}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          return true; // ✅ found! tell index.js to stop
        }
        // ❌ second leg not available, try next mid station
      }

      index++; // ❌ first leg not available, try next mid station
    }

    return false; // ❌ no valid split ticket found

    // ✅ search function — checks availability for given from→to
    async function search(trainNo, fromStnCode, toStnCode, date, coach, quota) {
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
        const availabilityList = result.data.availability;

        // ✅ find matching date in availability array
        const match = availabilityList.find(
          (item) => item.date === normalizedDate,
        );

        console.log("match:", match);

        if (match) {
          console.log("status:", match.status);

          if (match.status === "AVAILABLE") {
            // ✅ available — return true to continue split search
            const { fromStationName, toStationName } = result.data.train;
            console.log(`✅ ${fromStationName} -> ${toStationName}`);
            return true; // ✅ this leg available
          } else {
            return false; // ❌ waitlist — try next mid station
          }
        }
      }

      return false; // ❌ no result — try next mid station
    }
  } catch (err) {
    console.log("❌ M4 error:", err.message);
    return false; // ❌ error — try next module
  }
}

export { m4 };
