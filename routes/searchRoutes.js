import express from "express";
import { theSplicerStopsOfTrain } from "../models/splicingfunction.js";
import { executeSequentialSearch } from "../controllers/searchController.js";
import { m1 } from "../models/modules/module1.js";
import { m2 } from "../models/modules/module2.js";
import { m3 } from "../models/modules/module3.js";
import { m4 } from "../models/modules/module4.js";
import { m5 } from "../models/modules/module5.js";

const router = express.Router();

// ✅ POST /search — main search route
router.post("/search", async (req, res) => {
  try {
    const { trainNo, fromStnCode, toStnCode, date, coach, quota } = req.body;

    console.log("=== m5ticket Search ===");
    console.log("received:", {
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    });

    // ✅ validate inputs
    if (!trainNo || !fromStnCode || !toStnCode || !date || !coach || !quota) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields",
      });
    }

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

    // ✅ send result as JSON
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log("❌ route error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
