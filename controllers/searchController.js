// Search modules are passed in as `strategies` from the route — imported here only for reference.
// The actual execution uses the destructured `strategies` object received as a parameter.
import { compileClient } from "pug";
import { m1 } from "../models/modules/module1.js"; // direct search from → to
import { m2 } from "../models/modules/module2.js"; // backwards search — earlier boarding stations
import { m3 } from "../models/modules/module3.js"; // forward search — later alighting stations
import { m4 } from "../models/modules/module4.js"; // split ticket via middle stations
import { m5 } from "../models/modules/module5.js"; // extended split — outside from→to range

// Runs each search module in order (M1 → M5) and returns the first successful result.
// Modules are tried from simplest (direct ticket) to most complex (extended split),
// so the best available option is always returned first.
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

  // ─────────────────────────────────────────────────────────────
  // M1 — Direct ticket from source to destination
  // Tries to book exactly from fromStnCode → toStnCode with no changes.
  // Returns: { trainNo, trainName, bookFrom, bookUpTo }
  // ─────────────────────────────────────────────────────────────
  const m1result = await m1(
    trainNo,
    fromStnCode,
    toStnCode,
    date,
    coach,
    quota,
  );
  if (m1result === coach) {
    return m1result;
  }
  if (m1result) {
    return {
      found: true,
      module: "M1",
      type: "Direct Ticket",
      ticket: {
        trainNo: m1result.trainNo, // the train number
        trainName: m1result.trainName, // display name of the train
        bookFrom: m1result.bookFrom, // station to book from (same as fromStnCode)
        bookUpTo: m1result.bookUpTo, // station to book up to (same as toStnCode)
        date,
        coach,
        quota,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // M2 — Earlier boarding station
  // No availability from the user's source, so book from an earlier station.
  // The user still boards at fromStnCode — the ticket just starts earlier.
  // Returns: { trainNo, trainName, bookFrom } — bookFrom is the earlier station
  // ─────────────────────────────────────────────────────────────
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
        trainNo: m2result.trainNo, // the train number
        trainName: m2result.trainName, // display name of the train
        bookFrom: m2result.bookFrom, // the earlier station the ticket is booked from
        boarding: fromStnCode, // where the user actually boards the train
        bookUpTo: toStnCode, // user's intended destination (unchanged)
        date,
        coach,
        quota,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // M3 — Later alighting station
  // No availability to the user's destination, so book till a later station.
  // The user still gets off at toStnCode — the ticket just extends further.
  // Returns: { trainNo, trainName, bookUpTo } — bookUpTo is the later station
  // ─────────────────────────────────────────────────────────────
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
        trainNo: m3result.trainNo, // the train number
        trainName: m3result.trainName, // display name of the train
        bookFrom: fromStnCode, // user's boarding station (unchanged)
        dropOff: toStnCode, // where the user actually gets off
        bookUpTo: m3result.bookUpTo, // the later station the ticket is booked up to
        date,
        coach,
        quota,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // M4 — Split ticket via a middle station
  // No single ticket available — journey is split into 2 legs at a mid station.
  // Leg 1: earlier station → mid station (user boards at fromStnCode)
  // Leg 2: mid station → later station (user exits at toStnCode)
  // Returns: { trainNo, trainName, bookFrom, midStation, bookUpTo }
  // ─────────────────────────────────────────────────────────────
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
          trainNo: m4result.trainNo, // the train number
          trainName: m4result.trainName, // display name of the train
          bookFrom: m4result.bookFrom, // station this leg is booked from
          boarding: fromStnCode, // where the user actually boards
          bookUpTo: m4result.midStation, // leg 1 ends at the mid station
          changeSeat: m4result.midStation, // user changes seat here before leg 2
          date,
          coach,
          quota,
        },
        leg2: {
          bookFrom: m4result.midStation, // leg 2 starts from the mid station
          dropOff: toStnCode, // where the user actually gets off
          bookUpTo: m4result.bookUpTo, // station this leg is booked up to
          date,
          coach,
          quota,
        },
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // M5 — Extended split outside the source→destination range
  // Combines M2 + M3: books from an earlier station AND up to a later station.
  // The user boards at fromStnCode and exits at toStnCode — the ticket spans wider.
  // Returns: { trainNo, trainName, bookFrom, bookUpTo }
  // ─────────────────────────────────────────────────────────────
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
        trainNo: m5result.trainNo, // the train number
        trainName: m5result.trainName, // display name of the train
        bookFrom: m5result.bookFrom, // the earlier station the ticket starts from
        boarding: fromStnCode, // where the user actually boards
        dropOff: toStnCode, // where the user actually gets off
        bookUpTo: m5result.bookUpTo, // the later station the ticket ends at
        date,
        coach,
        quota,
      },
    };
  }

  // All five modules exhausted — no availability found on any strategy
  return {
    found: false,
    message: "❌ No tickets found across all search by engine",
  };
}
