import express from "express";
import { theSplicerStopsOfTrain } from "../models/splicingfunction.js";
import { executeSequentialSearch } from "../controllers/searchController.js";

// Search modules — each handles a different ticket-finding strategy:
// m1 → direct ticket from source to destination
// m2 → board earlier than the requested source station
// m3 → alight later than the requested destination station
// m4 → split ticket through an intermediate station (2 tickets)
// m5 → extended split ticket outside the source→destination range
import { m1 } from "../models/modules/module1.js";
import { m2 } from "../models/modules/module2.js";
import { m3 } from "../models/modules/module3.js";
import { m4 } from "../models/modules/module4.js";
import { m5 } from "../models/modules/module5.js";

const router = express.Router();

// POST /search
// Main route — receives the search form, runs all modules, and renders the right result view.
router.post("/search", async (req, res) => {
  try {
    // Pull all required fields from the submitted form body
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

    // Reject the request early if any field is missing
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

    // The HTML date input sends "YYYY-MM-DD" but the railway API expects "DD-MM-YYYY".
    // This helper re-orders the parts and zero-pads day/month just in case.
    const normalizeDate = (date) => {
      const pad = (num) => String(num).trim().padStart(2, "0");
      const [year, month, day] = date.split("-");
      return `${pad(day)}-${pad(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    console.log("date from form:", date); // e.g. 2026-06-29
    console.log("normalized date:", normalizedDate); // e.g. 29-06-2026
    console.log("inputing-data:", {
      trainNo,
      fromStnCode,
      toStnCode,
      normalizedDate,
      coach,
      quota,
    });

    // Fetch the list of all stations the train stops at between fromStnCode and toStnCode.
    // This "spliced" array is shared across all modules so they know the valid station range.
    const splicedTrainArr = await theSplicerStopsOfTrain(
      trainNo,
      fromStnCode,
      toStnCode,
    );

    // If either station wasn't found in the route, abort early with a clear message
    if (!splicedTrainArr || splicedTrainArr.length === 0) {
      return res.status(400).render("invalid-input", {
        trainNo,
        fromStnCode,
        toStnCode,
        date: normalizedDate,
        coach,
        quota,
        message: `❌ Station "${fromStnCode}" or "${toStnCode}" not found in train ${trainNo} route.`,
      });
    }

    console.log("\n🔎 Searching for tickets... Please wait.");

    // Run modules m1 through m5 in sequence.
    // Each module tries its own strategy; the first one that finds availability wins.
    const result = await executeSequentialSearch(
      {
        trainNo,
        fromStnCode,
        toStnCode,
        date: normalizedDate,
        coach,
        quota,
        splicedTrainArr,
      },
      { m1, m2, m3, m4, m5 },
    );

    if (result === coach) {
      return res.status(400).render("invalid-input", {
        trainNo,
        fromStnCode,
        toStnCode,
        date: normalizedDate,
        coach,
        quota,
        message: `❌ Station "${fromStnCode}" or "${toStnCode}" not found in train ${trainNo} route.`,
      });
    }

    // Build the base data object that every EJS view needs for display
    const viewData = {
      trainNo,
      fromStnCode,
      toStnCode,
      date: normalizedDate,
      coach,
      quota,
      trainName: result?.trainName || null,
    };

    // Merge search result with view data into a single object for the template
    const combinedJson = { ...result, ...viewData };
    console.log(combinedJson);

    // Route to the correct EJS view based on which module found the ticket
    switch (combinedJson?.module) {
      case "M1":
        // Direct ticket — single journey, no changes
        return res.render("m1", combinedJson);

      case "M2":
        // Board at an earlier station than requested — single ticket covers the journey
        return res.render("m2", combinedJson);

      case "M3":
        // Alight at a later station than requested — single ticket covers the journey
        return res.render("m3", combinedJson);

      case "M4":
        // No direct availability — journey split into 2 tickets via a middle station
        return res.render("m4", combinedJson);

      case "M5":
        // Extended split — availability found outside the original source→destination range
        return res.render("m5", combinedJson);

      default:
        // None of the modules found a ticket — show the failure page
        return res.render("failure", {
          ...viewData,
          message: result?.message || "❌ No tickets found",
        });
    }
  } catch (error) {
    // Unexpected server-side error — log it and show a generic failure page
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
