import { theSplicerStopsOfTrain } from "./models/splicingfunction.js";
import { executeSequentialSearch } from "./controllers/searchController.js";
import { m1 } from "./models/modules/module1.js";
import { m2 } from "./models/modules/module2.js";
import { m3 } from "./models/modules/module3.js";
import { m4 } from "./models/modules/module4.js";
import { m5 } from "./models/modules/module5.js";

// ✅ main run function — called from main.js
export async function run(trainNo, fromStnCode, toStnCode, date, coach, quota) {
  try {
    console.log("=== mSticket Search ===");
    console.log("received:", {
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    });

    // ✅ get all stations between fromStnCode and toStnCode
    const splicedTrainArr = await theSplicerStopsOfTrain(
      trainNo,
      fromStnCode,
      toStnCode,
    );

    console.log("\n🔎 Searching for tickets... Please wait.");

    // ✅ run m1→m5 and get result
    const result = await executeSequentialSearch(
      { trainNo, fromStnCode, toStnCode, date, coach, quota, splicedTrainArr },
      { m1, m2, m3, m4, m5 },
    );

    // ✅ return result to main.js → res.json()
    return result;
  } catch (error) {
    console.log("❌ run error:", error.message);
    return { found: false, message: error.message };
  } finally {
    console.log("search completed");
  }
}
