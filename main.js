import express from "express";
import "dotenv/config";
import { connectValkey } from "./cache/cache.js";
import { run } from "./index.js";

const app = express();
const port = process.env.PORT || 8000;

// ✅ middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ handles form data

app.post("/search", async (req, res) => {
  try {
    const { trainNo, fromStnCode, toStnCode, date, coach, quota } = req.body;

    console.log("received:", {
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    });

    // ✅ validate
    if (!trainNo || !fromStnCode || !toStnCode || !date || !coach || !quota) {
      return res.status(400).json({
        success: false,
        message: "❌ Missing required fields",
      });
    }

    // ✅ await result
    const result = await run(
      trainNo,
      fromStnCode,
      toStnCode,
      date,
      coach,
      quota,
    );

    // ✅ send response
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.log("❌ error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ✅ start server
app.listen(port, async () => {
  await connectValkey(); // ✅ connect valkey first
  console.log(`🚀 server running on port ${port}`);
});
