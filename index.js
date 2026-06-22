import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { connectValkey } from "./cache/cache.js";
import { theSplicerStopsOfTrain } from "./splicingfunction.js";

// ✅ import all search modules
import { m1 } from "./modules/module1.js"; // direct search from → to
import { m2 } from "./modules/module2.js"; // backwards search — earlier boarding stations
import { m3 } from "./modules/module3.js"; // forward search — later alighting stations
import { m4 } from "./modules/module4.js"; // split ticket via middle stations
import { m5 } from "./modules/module5.js"; // extended split — outside from→to range

// ✅ initialize terminal interface
const rl = readline.createInterface({ input, output });

// ✅ main run function
async function run() {
  try {
    let finding = true; // ✅ true = still searching, false = found!

    await connectValkey();
    // ✅ welcome message
    console.log("=== m5-ticket Search ===");

    // ✅ collect user inputs
    let trainNo = await rl.question("Enter Train Number    (e.g., 12711): ");
    let fromStnCode = await rl.question(
      "Enter From Station    (e.g., BZA):   ",
    );
    let toStnCode = await rl.question("Enter To Station      (e.g., MAS):   ");
    let date = await rl.question("Enter Date            (DD-MM-YYYY):  ");
    let coach = await rl.question("Enter Coach           (e.g., 2S):    ");
    let quota = await rl.question("Enter Quota           (e.g., GN):    ");

    // ✅ get all stations between fromStnCode and toStnCode
    const splicedTrainArr = await theSplicerStopsOfTrain(
      trainNo,
      fromStnCode,
      toStnCode,
    );

    console.log("\n🔎 Searching for tickets... Please wait.");
    console.log("\n=== Availability Results ===");

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ M1 — direct search from → to
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (finding) {
      console.log("\n🔍 Trying M1 (Direct Search)...");
      const result = await m1(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        finding,
      );
      if (result) finding = false; // ✅ found! stop searching
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ M2 — backwards search (earlier boarding stations)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (finding) {
      console.log("\n🔍 Trying M2 (Earlier Boarding)...");
      const result = await m2(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        splicedTrainArr,
        finding,
      );
      if (result) finding = false; // ✅ found! stop searching
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ M3 — forward search (later alighting stations)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (finding) {
      console.log("\n🔍 Trying M3 (Later Alighting)...");
      const result = await m3(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        splicedTrainArr,
        finding,
      );
      if (result) finding = false; // ✅ found! stop searching
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ M4 — split ticket via middle stations
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (finding) {
      console.log("\n🔍 Trying M4 (Split Ticket — Middle Stations)...");
      const result = await m4(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        splicedTrainArr,
        finding,
      );
      if (result) finding = false; // ✅ found! stop searching
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ M5 — extended split outside from→to range
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (finding) {
      console.log("\n🔍 Trying M5 (Extended Split — Outside Range)...");
      const result = await m5(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
        splicedTrainArr,
        finding,
      );
      if (result) finding = false; // ✅ found! stop searching
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ final result summary
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!finding) {
      console.log("\n✅ Ticket found! Search complete.");
    } else {
      console.log("\n❌ No tickets found across all search methods.");
    }
  } catch (error) {
    console.error("❌ An error occurred:", error.message);
  } finally {
    // ✅ always close terminal interface at the end
    rl.close();

    // Force the Node.js process to exit cleanly
    process.exit(0);
  }
}

// ✅ start the app
run();
