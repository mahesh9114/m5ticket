import { readFile } from "node:fs";
import data from "./ALL-TRAINS-8490.json" with { type: "json" };

async function theSplicerStopsOfTrain(trainNo, fromstncode, tostncode) {
  const paddedTrainNo = String(trainNo).padStart(5, "0"); // "12711" → "12711", "961" → "00961"

  const trainData = data[0].trains[paddedTrainNo];
  if (!trainData) {
    console.error(`Train ${paddedTrainNo} not found.`);
    return;
  }

  const trainStops = trainData.stops;
  //splicedcodes
  const splicedcodes = trainStops.map((stn) => stn.split(":")[0]);
  // console.log(trainStops);
  // console.log(splicedcodes);

  function theSlicerOfStops(fromstncode, tostncode, splicedcodes) {
    const fromindex = splicedcodes.indexOf(fromstncode);
    const codeslength = splicedcodes.length;
    const toindex = splicedcodes.indexOf(tostncode);

    // console.log(fromindex); //starting index
    // console.log(toindex); //destination index
    // console.log(codeslength); //lendthodindex

    const fromm = (fromIndex) => {
      // Subtracts 4, but forces 0 if the result is negative
      return Math.max(0, fromIndex - 4);
    };

    const too = (tooIndex, codeslength) => {
      // 1. Safely convert inputs to numbers, defaulting to 0 if they are invalid/missing
      const cleanTooIndex = Number(tooIndex) || 0;
      const cleanCodesLength = Number(codeslength) || 0;

      // 2. Calculate maxIndex safely (ensure it doesn't drop below 0)
      const maxIndex = Math.max(0, cleanCodesLength);

      // 3. Return the minimum value safely
      return Math.min(maxIndex, cleanTooIndex + 5);
    };

    // console.log(fromm(fromindex));
    // console.log(too(toindex, codeslength));

    //slice
    //console.log(splicedcodes);
    const frommmslice = fromm(fromindex);
    const toooslice = too(toindex, codeslength);

    const splicedTrainArr = splicedcodes.slice(frommmslice, toooslice);
    console.log(splicedTrainArr);
    return splicedTrainArr;
  }
  return theSlicerOfStops(fromstncode, tostncode, splicedcodes);
}

theSplicerStopsOfTrain();

export { theSplicerStopsOfTrain };
