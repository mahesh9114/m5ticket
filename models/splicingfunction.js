import data from "../ALL-TRAINS-8490.json" with { type: "json" };

// Looks up a train by number and returns a sliced array of station codes
// centered around the user's journey — 4 stations before fromStnCode
// and 4 stations after toStnCode — giving modules room to search nearby stations.
async function theSplicerStopsOfTrain(trainNo, fromstncode, tostncode) {
  // Pad the train number to 5 digits so it matches the JSON key format
  // e.g. "961" → "00961", "12711" → "12711"
  const paddedTrainNo = String(trainNo).padStart(5, "0");

  // Look up the train in the JSON dataset
  const trainData = data[0].trains[paddedTrainNo];

  if (!trainData) {
    console.error(`Train ${paddedTrainNo} not found.`);
    return;
  }

  // Each stop is stored as "STNCODE:arrivalTime:departureTime" — extract just the station code
  const trainStops = trainData.stops;
  const splicedcodes = trainStops.map((stn) => stn.split(":")[0]);

  // Takes the full station code list and returns only the slice relevant to this journey.
  // The slice extends 4 stations before `fromstncode` and 4 stations after `tostncode`
  // so that M2, M3, M4, and M5 have nearby stations to search within.
  function theSlicerOfStops(fromstncode, tostncode, splicedcodes) {
    const fromIndex = splicedcodes.indexOf(fromstncode);
    const toIndex = splicedcodes.indexOf(tostncode);
    const codesLength = splicedcodes.length;

    // Go back up to 4 stations before the source — but never below index 0
    const fromSliceIndex = (fromIndex) => Math.max(0, fromIndex - 4);

    // Go forward up to 4 stations after the destination — but never past the array end
    const toSliceIndex = (toIndex, codesLength) => {
      const cleanToIndex = Number(toIndex);
      const cleanCodesLength = Number(codesLength);
      const maxIndex = Math.max(0, cleanCodesLength); // guard against negative lengths
      return Math.min(maxIndex, cleanToIndex + 5);
    };

    const sliceFrom = fromSliceIndex(fromIndex);
    const sliceTo = toSliceIndex(toIndex, codesLength);

    // Slice out only the relevant portion of the route
    const splicedTrainArr = splicedcodes.slice(sliceFrom, sliceTo);
    console.log(splicedTrainArr);

    return splicedTrainArr;
  }

  return theSlicerOfStops(fromstncode, tostncode, splicedcodes);
}

export { theSplicerStopsOfTrain };
