import "dotenv/config";
import { setCache, getCache } from "../../cache/cache.js";
import { configure, getAvailability } from "railkit";

configure(process.env.RAILKIT_API_KEY);

async function m5(
  trainNo,
  fromStnCode,
  toStnCode,
  date,
  coach,
  quota,
  splicedTrainArr,
  finding,
) {
  try {
    let arr = splicedTrainArr;
    let fromIndex = arr.indexOf(fromStnCode);
    let toIndex = arr.indexOf(toStnCode);
    let fromarr = arr.slice(0, fromIndex);
    let toarr = arr.slice(toIndex + 1, arr.length);

    console.log("fromIndex:", fromIndex);
    console.log("toIndex:", toIndex);
    console.log(`fromarr: ${fromarr}`);
    console.log(`toarr: ${toarr}`);

    const normalizeDate = (d) => {
      const [day, month, year] = d.split("-");
      return `${parseInt(day)}-${parseInt(month)}-${year}`;
    };
    const normalizedDate = normalizeDate(date);

    // ✅ step 1 — processResult FIRST
    function processResult(result) {
      const { fromStationName, toStationName } = result.data.train;
      const availabilityList = result.data.availability;
      const match = availabilityList.find(
        (item) => item.date === normalizedDate,
      );
      console.log("match:", match);
      if (match) {
        console.log("status:", match.status);
        if (match.status === "AVAILABLE") {
          console.log(`✅ ${fromStationName} -> ${toStationName}`);
          console.log(`📅 Date: ${match.date}`);
          return (true, fromStationName, toStationName);
        } else {
          return false;
        }
      }
      return false;
    }

    // ✅ step 2 — search SECOND
    async function search(trainNo, fromStnCode, toStnCode, date, coach, quota) {
      const cached = await getCache(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
      );
      if (cached) return processResult(cached);

      const result = await getAvailability(
        trainNo,
        fromStnCode,
        toStnCode,
        date,
        coach,
        quota,
      );

      if (result && result.success) {
        await setCache(
          trainNo,
          fromStnCode,
          toStnCode,
          date,
          coach,
          quota,
          result,
        );
        return processResult(result);
      }
      return false;
    }

    // ✅ step 3 — loops LAST
    let i = fromarr.length - 1;
    while (i >= 0) {
      const from = fromarr[i];
      for (let j = 0; j < toarr.length; j++) {
        const to = toarr[j];
        console.log(`trying: ${from} → ${to}`);
        const found = await search(trainNo, from, to, date, coach, quota);
        if (found) {
          console.log("\n🎉 Extended Ticket Found!");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log(`🎟️  ${from} -> ${to}`);
          console.log(`📅 Date: ${date}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          return true;
        }
      }
      i--;
    }
    return false;
  } catch (err) {
    console.log("❌ M5 error:", err.message);
    return false;
  }
}

export { m5 };
