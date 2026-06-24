import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import "dotenv/config";
import { connectValkey } from "./cache/cache.js";
import searchRoutes from "./routes/searchRoutes.js";

// ✅ recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8000;

// ✅ middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ set EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // ✅ views folder

// ✅ GET / — serve search form
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ mount search routes
app.use("/", searchRoutes);

// ✅ start server
app.listen(port, async () => {
  await connectValkey();
  console.log(`🚀 server running on port ${port}`);
});
