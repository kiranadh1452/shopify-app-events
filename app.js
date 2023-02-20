import { sendSlackMessage } from "./slack/index.js";
import { bqEventSaver } from "./helpers/bqEventSaver.js";
import { fetchAppEvents } from "./helpers/shopifyPartnersFetcher.js";
import { saveNextCursor, getNextCursor } from "./storage/nextURLStorage.js";
import { functionName, projectId, batchSize } from "./projectConfig/config.js";

const run = async () => {
    let before = (await getNextCursor()) || "";
    let initialCursor = before;
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
    if (initialCursor != finalCursor) {
        await saveNextCursor(finalCursor);
    }

    return true;
};

/**
 * description: Entry point for cloud function
 * In google cloud function, use `pullFromShopifyPartners` as the entry point
 */
export const pullFromShopifyPartners = async (req, res) => {
    try {
        // noting the start time of the execution
        global.startTime = new Date().toISOString();
        sendSlackMessage("Started pulling data from Shopify Partners");

        const ranComplete = await run();
        if (ranComplete) {
            sendSlackMessage(
                "Finished pulling data from Shopify Partners successfully"
            );
        } else {
            sendSlackMessage(
                "Finished pulling data from Shopify Partners with some issues"
            );
        }
        const endTime = new Date().toISOString();
        const urlForReport = `https://console.cloud.google.com/logs/query;query=timestamp>%3D"${startTime}"%0Atimestamp<%3D"${endTime}"%0Aresource.labels.function_name%3D"${functionName}";?project=${projectId}`;

        sendSlackMessage(
            `Url for report of app events pulling cloud function is: ${urlForReport}`
        );

        return res.send("Success");
    } catch (error) {
        console.log("Error: ", error);
        const endTime = new Date().toISOString();
        const urlForReport = `https://console.cloud.google.com/logs/query;query=timestamp>%3D"${startTime}"%0Atimestamp<%3D"${endTime}"%0Aresource.labels.function_name%3D"${functionName}";?project=${projectId}`;

        sendSlackMessage(
            `
            Error while pulling app events from shopify partners.
            Error Message: ${error.message} 
            Url for report is: ${urlForReport}`
        );
        return res.status(400).end();
    }
};
