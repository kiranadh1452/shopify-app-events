import { bqEventSaver } from "./helpers/bqEventSaver.js";
import { fetchAppEvents } from "./helpers/shopifyPartnersFetcher.js";
import { saveNextCursor, getNextCursor } from "./storage/nextURLStorage.js";

let batchSize = 100;

const run = async () => {
    let after = (await getNextCursor()) || "";
    console.log("Starting from cursor: ", after);
    let finalCursor = after;
    let hasNext = true;
    let count = 0;
    let recordsTillNow = 0;

    // while there are more records to fetch or we have already made 1000 requests
    while (hasNext && count < 1000) {
        const { records, cursor, hasNextPage } = await fetchAppEvents(
            batchSize,
            after
        );
        recordsTillNow += records.length;
        console.log(
            "No. of records fetched in this execution: ",
            recordsTillNow
        );
        console.log("More records left ? =>", hasNextPage ? "Yes" : "No");
        console.log("Current cursor: ", cursor);

        // storing records in bigquery
        const status = await bqEventSaver(records);
        console.log("Status of bq storing: ", status);

        // updating cursor and next page indicator
        after = cursor;
        finalCursor = cursor;

        // update hasNext at the end
        hasNext = hasNextPage;
        count++;
    }

    console.log("Final cursor: ", finalCursor);

    // save the final cursor
    await saveNextCursor(finalCursor);
};
run();
