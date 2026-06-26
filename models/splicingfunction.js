import { configure, getTrainInfo } from "railkit";

// Looks up a train by number and returns a sliced array of station codes
// centered around the user's journey — 4 stations before fromStnCode
// and 4 stations after toStnCode — giving modules room to search nearby stations.
async function theSplicerStopsOfTrain(trainNo, fromstncode, tostncode) {
  // Fetch train info from railkit using the train number
  const trainInfo = await getTrainInfo(trainNo);

  // If train not found, log an error and exit early
  if (!trainInfo) {
    console.error(`Train ${trainNo} not found.`);
    return null;
  }

  // Deep clone the trainInfo object to avoid mutating the original
  const data = JSON.parse(JSON.stringify(trainInfo));

  // Extract all station codes as a flat array
  // e.g. ["BZA", "TEL", "NDO", "BPP", "CLX", "OGL", "SKM", ...]
  const splicedcodes = data.data.route.map((stn) => stn.stnCode);
  console.log(splicedcodes);

  // Validate that both fromstncode and tostncode exist in the route
  if (!splicedcodes.includes(fromstncode)) {
    console.error(
      `Source station "${fromstncode}" not found in train ${trainNo} route.`,
    );
    return null;
  }
  if (!splicedcodes.includes(tostncode)) {
    console.error(
      `Destination station "${tostncode}" not found in train ${trainNo} route.`,
    );
    return null;
  }

  // Takes the full station code list and returns only the slice relevant to this journey.
  // The slice extends 4 stations before fromstncode and 4 stations after tostncode
  // so that nearby modules have enough surrounding stations to search within.
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
      return Math.min(cleanCodesLength, cleanToIndex + 5);
    };

    const sliceFrom = fromSliceIndex(fromIndex);
    const sliceTo = toSliceIndex(toIndex, codesLength);

    // Return only the relevant portion of the route
    return splicedcodes.slice(sliceFrom, sliceTo);
  }

  return theSlicerOfStops(fromstncode, tostncode, splicedcodes);
}

export { theSplicerStopsOfTrain };
