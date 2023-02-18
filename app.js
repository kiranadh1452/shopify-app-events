import { bqEventSaver } from "./helpers/bqEventSaver.js";
import { fetchAppEvents } from "./helpers/shopifyPartnersFetcher.js";
import { saveNextCursor, getNextCursor } from "./storage/nextURLStorage.js";

let batchSize = 100;

const run = async () => {
    let before = (await getNextCursor()) || "";
    console.log("Starting from cursor: ", before);
    let finalCursor = before;
    let hasNext = true;
    let count = 0;
    let recordsTillNow = 0;

    // while there are more records to fetch or we have already made 1000 requests
    while (hasNext && count < 1000) {
        const { records, cursor, hasPreviousPage } = await fetchAppEvents(
            batchSize,
            before
        );

        // if no records are fetched, break the loop
        if (records.length === 0) {
            console.log("No records fetched, breaking the loop");
            break;
        }

        recordsTillNow += records.length;
        console.log(
            "No. of records fetched in this execution: ",
            recordsTillNow
        );
        console.log("More records left ? =>", hasPreviousPage ? "Yes" : "No");
        console.log("Current cursor: ", cursor);

        // storing records in bigquery
        const status = await bqEventSaver(records);
        console.log("Stored in BigQuery? : ", status ? "Yes" : "No");

        // updating cursor and next page indicator
        before = cursor;
        finalCursor = cursor;

        // update hasNext at the end
        hasNext = hasPreviousPage;
        count++;
    }

    console.log("Final cursor: ", finalCursor);

    // save the final cursor
    if (before != finalCursor) {
        await saveNextCursor(finalCursor);
    }
};
run();
