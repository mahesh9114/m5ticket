import "dotenv/config";
import { configure, getAvailability } from "railkit";

// ✅ configure railkit with api key
configure(process.env.RAILKIT_API_KEY);

// m1 — direct search from → to
async function m1(
  trainNo, // train number e.g. 12711
  fromStnCode, // from station code e.g. BZA
  toStnCode, // to station code e.g. MAS
  date, // date e.g. 22-06-2026
  coach, // coach type e.g. 2S
  quota, // quota e.g. GN
  finding, // global finding flag
) {
  try {
    // ✅ await the api call
    const result = await getAvailability(
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    );

    console.log("result:", result);

    // ✅ check if result is valid
    if (result && result.success) {
      const { fromStationName, toStationName } = result.data.train;

      // ✅ normalize date format "22-06-2026" → "22-6-2026"
      const normalizeDate = (d) => {
        const [day, month, year] = d.split("-");
        return `${parseInt(day)}-${parseInt(month)}-${year}`;
      };
      const normalizedDate = normalizeDate(date);

      // ✅ find matching date in availability array
      const availabilityList = result.data.availability;
      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );

      console.log("match:", match);

      if (match) {
        console.log("status:", match.status);

        // ✅ check if available
        if (match.status === "AVAILABLE") {
          console.log(`✅ Direct ticket found!`);
          console.log(`🎟️  ${fromStationName} -> ${toStationName}`);
          console.log(`📅 Date: ${match.date}`);
          return true; // ✅ found! stop search
        } else {
          console.log(`❌ Status: "${match.status}" — not available`);
          return false; // ❌ not available, try next module
        }
      }
    }

    return false; // ❌ no result
  } catch (error) {
    console.log("❌ M1 error:", error.message);
    return false; // ❌ error, try next module
  }
}

export { m1 };
