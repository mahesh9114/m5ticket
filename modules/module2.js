import "dotenv/config";
import { configure, getAvailability } from "railkit";

// ✅ configure railkit with api key
configure(process.env.RAILKIT_API_KEY);

// m2 — backwards search from stations before fromStnCode → toStnCode
// logic: if direct is waitlist, try boarding from earlier stations
async function m2(
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
    const fromIndex = arr.indexOf(fromStnCode);
    const toIndex = arr.indexOf(toStnCode);
    console.log("fromIndex:", fromIndex);
    console.log("toIndex:", toIndex);

    // ✅ normalize date format "22-06-2026" → "22-6-2026"
    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date); // normalize once outside loop

    // ✅ start from station BEFORE fromStnCode and go backwards
    let index = fromIndex - 1;

    while (index >= 0) {
      const from = arr[index]; // earlier station
      console.log("trying from:", from);

      // ✅ search earlier station → toStnCode
      const found = await search(trainNo, from, toStnCode, date, coach, quota);

      if (found) return true; // ✅ found! tell index.js to stop

      index--; // ❌ not found, try next earlier station
    }

    return false; // ❌ no earlier station worked

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
            // ✅ found available ticket
            const { fromStationName, toStationName } = result.data.train;
            console.log(
              `✅ Success! Found a way from ${fromStationName} -> to ${toStationName}`,
            );
            console.log(`📅 Date: ${match.date}`);
            return true; // ✅ available — stop loop
          } else {
            return false; // ❌ waitlist — try next station
          }
        }
      }

      return false; // ❌ no result — try next station
    }
  } catch (err) {
    console.log("❌ M2 error:", err.message);
    return false; // ❌ error — try next module
  }
}

export { m2 };
