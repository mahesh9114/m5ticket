import express from "express";
import "dotenv/config";
import { connectValkey } from "./cache/cache.js";
import searchRoutes from "./routes/searchRoutes.js"; // ✅ import routes

const app = express();
const port = process.env.PORT || 8000;

// ✅ middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ routes
app.use("/", searchRoutes); // ✅ mount routes

// ✅ start server
app.listen(port, async () => {
  await connectValkey();
  console.log(`🚀 server running on port ${port}`);
});
