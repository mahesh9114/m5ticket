import express from "express";
import { theSplicerStopsOfTrain } from "../models/splicingfunction.js";
import { executeSequentialSearch } from "../controllers/searchController.js";

// ✅ import all search modules
import { m1 } from "../models/modules/module1.js"; // direct search from → to
import { m2 } from "../models/modules/module2.js"; // backwards search — earlier boarding stations
import { m3 } from "../models/modules/module3.js"; // forward search — later alighting stations
import { m4 } from "../models/modules/module4.js"; // split ticket via middle stations
import { m5 } from "../models/modules/module5.js"; // extended split — outside from→to range

const router = express.Router();

// ✅ POST /search — main search route
router.post("/search", async (req, res) => {
  try {
    // ✅ extract inputs from form body
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

    // ✅ validate — all fields required
    if (!trainNo || !fromStnCode || !toStnCode || !date || !coach || !quota) {
      return res.status(400).render("failure", {
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        message: "❌ Missing required fields",
      });
    }

    // ✅ normalize date format
    // HTML form sends "2026-06-29" (YYYY-MM-DD)
    // API expects  "29-06-2026"  (DD-MM-YYYY)
    const normalizeDate = (date) => {
      const pad = (num) => String(num).trim().padStart(2, "0");
      const [year, month, day] = date.split("-");
      return `${pad(day)}-${pad(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    console.log("date from form:", date); // 2026-06-29
    console.log("normalized date:", normalizedDate); // 29-06-2026
    console.log("inputing-data:", {
      trainNo,
      fromStnCode,
      toStnCode,
      normalizedDate,
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

    // ✅ run m1→m5 sequential search
    const result = await executeSequentialSearch(
      {
        trainNo,
        fromStnCode,
        toStnCode,
        date: normalizedDate, // ✅ pass normalized date to modules
        coach,
        quota,
        splicedTrainArr,
      },
      { m1, m2, m3, m4, m5 },
    );

    // ✅ data passed as per EJS view

    // console.log(result);
    const viewData = {
      trainNo,
      fromStnCode,
      toStnCode,
      date: normalizedDate, // ✅ formatted date for display
      coach,
      quota,
      trainName: result?.trainName || null, // ✅ train name if available
      //ticket: result?.ticket || null, // ✅ ticket data for EJS
    };
    //console.log(viewData);

    const combinedJson = { ...result, ...viewData };
    console.log(combinedJson);

    // ✅ switch on module — render correct EJS view
    switch (combinedJson?.module) {
      case "M1":
        // ✅ direct ticket — 1 ticket journey
        return res.render("m1", combinedJson);

      case "M2":
        // ✅ earlier boarding — 1 ticket journey
        return res.render("m2", combinedJson);

      case "M3":
        // ✅ later alighting — 1 ticket journey
        return res.render("m3", combinedJson);

      case "M4":
        // ✅ split ticket — 2 ticket journey
        return res.render("m4", combinedJson);

      case "M5":
        // ✅ extended split — 1 ticket journey
        return res.render("m5", combinedJson);

      default:
        // ❌ nothing found — render failure page
        return res.render("failure", {
          ...viewData,
          message: result?.message || "❌ No tickets found",
        });
    }
  } catch (error) {
    // ❌ unexpected error — render failure page with error message
    console.log("❌ route error:", error.message);
    return res.status(500).render("failure", {
      trainNo: req.body?.trainNo,
      fromStnCode: req.body?.fromStnCode,
      toStnCode: req.body?.toStnCode,
      date: req.body?.date,
      coach: req.body?.coach,
      quota: req.body?.quota,
      message: error.message,
    });
  }
});

export default router;
