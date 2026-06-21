import "dotenv/config";
import { configure, getAvailability } from "railkit";

// ✅ configure railkit with api key
configure(process.env.RAILKIT_API_KEY);

// m5 — extended split ticket search outside from→to range
// logic: search stations BEFORE fromStnCode paired with stations AFTER toStnCode
// fromarr = stations before fromStnCode
// toarr   = stations after toStnCode
async function m5(
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

    // ✅ stations BEFORE fromStnCode
    let fromarr = arr.slice(0, fromIndex);

    // ✅ stations AFTER toStnCode
    let toarr = arr.slice(toIndex + 1, arr.length);

    console.log("fromIndex:", fromIndex);
    console.log("toIndex:", toIndex);
    console.log(`fromarr: ${fromarr}`);
    console.log(`toarr: ${toarr}`);
    console.log("fromarr.length:", fromarr.length);
    console.log("toarr.length:", toarr.length);

    // ✅ normalize date format "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date); // normalize once outside loop

    // ✅ loop backwards through fromarr (stations before fromStnCode)
    let i = fromarr.length - 1;

    while (i >= 0) {
      const from = fromarr[i]; // earlier boarding station

      // ✅ loop forwards through toarr (stations after toStnCode)
      for (let j = 0; j < toarr.length; j++) {
        const to = toarr[j]; // later alighting station
        console.log(`trying: fromarr[${i}]=${from} → toarr[${j}]=${to}`);

        // ✅ search earlier station → later station
        const found = await search(trainNo, from, to, date, coach, quota);

        if (found) {
          // ✅ display result
          console.log("\n🎉 Extended Ticket Found!");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`🎟️  ${from} -> ${to}`);
          console.log(`📅 Date: ${date}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          return true; // ✅ found! tell index.js to stop
        }
      }

      i--; // ❌ try next earlier station
    }

    return false; // ❌ no extended ticket found

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
            // ✅ available — return true
            const { fromStationName, toStationName } = result.data.train;
            console.log(`✅ Success! ${fromStationName} -> ${toStationName}`);
            console.log(`📅 Date: ${match.date}`);
            return true; // ✅ available — stop loops
          } else {
            return false; // ❌ waitlist — try next combination
          }
        }
      }

      return false; // ❌ no result — try next combination
    }
  } catch (err) {
    console.log("❌ M5 error:", err.message);
    return false; // ❌ error — try next module
  }
}

export { m5 };
