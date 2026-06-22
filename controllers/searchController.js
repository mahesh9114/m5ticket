// ✅ import all search modules
import { m1 } from "../models/modules/module1.js"; // direct search from → to
import { m2 } from "../models/modules/module2.js"; // backwards search — earlier boarding stations
import { m3 } from "../models/modules/module3.js"; // forward search — later alighting stations
import { m4 } from "../models/modules/module4.js"; // split ticket via middle stations
import { m5 } from "../models/modules/module5.js"; // extended split — outside from→to range

export async function executeSequentialSearch(params, strategies) {
  const {
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
    splicedTrainArr,
  } = params;

  const { m1, m2, m3, m4, m5 } = strategies;

  // ✅ M1
  const m1result = await m1(
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
  );
  if (m1result) {
    return {
      found: true,
      module: "M1",
      type: "Direct Ticket",
      ticket: {
        from: fromStnCode,
        to: toStnCode,
        date,
        coach,
        quota,
      },
    };
  }

  // ✅ M2
  const m2result = await m2(
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
    splicedTrainArr,
  );
  if (m2result) {
    return {
      found: true,
      module: "M2",
      type: "Earlier Boarding",
      ticket: {
        from: m2result, // ✅ actual earlier station
        to: toStnCode,
        date,
        coach,
        quota,
      },
    };
  }

  // ✅ M3
  const m3result = await m3(
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
    splicedTrainArr,
  );
  if (m3result) {
    return {
      found: true,
      module: "M3",
      type: "Later Alighting",
      ticket: {
        from: fromStnCode,
        to: m3result, // ✅ actual later station
        date,
        coach,
        quota,
      },
    };
  }

  // ✅ M4
  const m4result = await m4(
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
    splicedTrainArr,
  );
  if (m4result) {
    return {
      found: true,
      module: "M4",
      type: "Split Ticket",
      ticket: {
        leg1: { from: fromStnCode, to: m4result, date, coach, quota }, // ✅ actual mid
        leg2: { from: m4result, to: toStnCode, date, coach, quota }, // ✅ actual mid
      },
    };
  }

  // ✅ M5
  const m5result = await m5(
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
    splicedTrainArr,
  );
  if (m5result) {
    return {
      found: true,
      module: "M5",
      type: "Extended Split",
      ticket: {
        from: m5result.from, // ✅ actual earlier station
        to: m5result.to, // ✅ actual later station
        date,
        coach,
        quota,
      },
    };
  }

  // ❌ nothing found
  return {
    found: false,
    message: "❌ No tickets found across all search methods",
  };
}
