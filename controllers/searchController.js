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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ M1 — direct search from → to
  // EJS uses: ticket.from, ticket.to, ticket.trainNo, ticket.date, ticket.coach, ticket.quota
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        trainNo: m1result.trainNo, // ✅ m1.ejs: ticket.trainNo
        trainName: m1result.trainName, // ✅ m1.ejs: ticket.trainName
        bookFrom: m1result.bookFrom, // ✅ m1.ejs: ticket.from
        bookUpTo: m1result.bookUpTo, // ✅ m1.ejs: ticket.to
        date, // ✅ m1.ejs: ticket.date
        coach, // ✅ m1.ejs: ticket.coach
        quota, // ✅ m1.ejs: ticket.quota
      },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ M2 — earlier boarding station
  // EJS uses: ticket.bookFrom, ticket.boarding, ticket.bookUpTo, ticket.date, ticket.coach, ticket.quota
  // m2 returns: earlier station code string
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        trainNo: m2result.trainNo, // ✅ m2.ejs: ticket.trainNo
        trainName: m2result.trainName, // ✅ m2.ejs: ticket.trainName
        bookFrom: m2result.bookFrom, // ✅ m2.ejs: ticket.bookFrom — earlier station to book from
        boarding: fromStnCode, // ✅ m2.ejs: ticket.boarding — user's actual boarding station
        bookUpTo: toStnCode, // ✅ m2.ejs: ticket.bookUpTo — destination
        date, // ✅ m2.ejs: ticket.date
        coach, // ✅ m2.ejs: ticket.coach
        quota, // ✅ m2.ejs: ticket.quota
      },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ M3 — later alighting station
  // EJS uses: ticket.bookFrom, ticket.dropOff, ticket.bookUpTo, ticket.date, ticket.coach, ticket.quota
  // m3 returns: later station code string
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        trainNo: m3result.trainNo, // ✅ m3.ejs: ticket.trainNo
        trainName: m3result.trainName, // ✅ m3.ejs: ticket.trainName
        bookFrom: fromStnCode, // ✅ m3.ejs: ticket.bookFrom — user's boarding station
        dropOff: toStnCode, // ✅ m3.ejs: ticket.dropOff — user's actual destination
        bookUpTo: m3result.bookUpTo, // ✅ m3.ejs: ticket.bookUpTo — later station to book till
        date, // ✅ m3.ejs: ticket.date
        coach, // ✅ m3.ejs: ticket.coach
        quota, // ✅ m3.ejs: ticket.quota
      },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ M4 — split ticket via middle station
  // EJS uses: ticket.leg1.bookFrom, ticket.leg1.boarding, ticket.leg1.changeSeat
  //           ticket.leg2.bookFrom, ticket.leg2.dropOff, ticket.leg2.bookUpTo
  // m4 returns: midStation string
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        leg1: {
          trainNo: m4result.trainNo, // ✅ m4.ejs: ticket.trainNo
          trainName: m4result.trainName, // ✅ m4.ejs: ticket.trainName
          bookFrom: m4result.bookFrom, // ✅ m4.ejs: ticket.leg1.bookFrom
          boarding: fromStnCode, // ✅ m4.ejs: ticket.leg1.boarding
          bookUpTo: m4result.midStation, //add these bookUpto to m4.ejs file to match my diagram fileds
          changeSeat: m4result.midStation, // ✅ m4.ejs: ticket.leg1.changeSeat — mid station
          date, // ✅ m4.ejs: ticket.leg1.date
          coach, // ✅ m4.ejs: ticket.leg1.coach
          quota, // ✅ m4.ejs: ticket.leg1.quota
        },
        leg2: {
          bookFrom: m4result.midStation, // ✅ m4.ejs: ticket.leg2.bookFrom — mid station
          dropOff: toStnCode, // ✅ m4.ejs: ticket.leg2.dropOff — user's destination
          bookUpTo: m4result.bookUpTo, // ✅ m4.ejs: ticket.leg2.bookUpTo
          date, // ✅ m4.ejs: ticket.leg2.date
          coach, // ✅ m4.ejs: ticket.leg2.coach
          quota, // ✅ m4.ejs: ticket.leg2.quota
        },
      },
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ M5 — extended split outside from→to range
  // EJS uses: ticket.bookFrom, ticket.bookUpTo, ticket.date, ticket.coach, ticket.quota
  // m5 returns: { from, to } object
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        trainNo: m5result.trainNo, // ✅ m5.ejs: ticket.trainNo
        trainName: m5result.trainName, // ✅ m5.ejs: ticket.trainName
        bookFrom: m5result.bookFrom, // ✅ m5.ejs: ticket.bookFrom — earlier station
        boarding: fromStnCode, //add these boarding to m5.ejs file to match my diagram fileds
        dropOff: toStnCode, //add these dropOff to m5.ejs file to match my diagram fileds
        bookUpTo: m5result.bookUpTo, // ✅ m5.ejs: ticket.bookUpTo — later station
        date, // ✅ m5.ejs: ticket.date
        coach, // ✅ m5.ejs: ticket.coach
        quota, // ✅ m5.ejs: ticket.quota
      },
    };
  }

  // ❌ nothing found
  return {
    found: false,
    message: "❌ No tickets found across all search by engine",
  };
}
