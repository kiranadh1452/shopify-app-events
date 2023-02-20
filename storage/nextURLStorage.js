import { Storage } from "@google-cloud/storage";
import { projectId } from "../projectConfig/config.js";

const storage = new Storage({
    keyFilename: "twperm.json",
    projectId,
});
const bucket = storage.bucket("posthog-batch-next-url-holder");

/**
 * description: Function to save the cursor for next batch of events to be fetched
 * @param {string} nextCursor - cursor for next batch of events
 */
export const saveNextCursor = async (nextCursor) => {
    try {
        await bucket
            .file("next-cursor-shopify-partners-daily")
            .save(nextCursor);
        return true;
    } catch (error) {
        console.log("Error saving next cursor", error);
        return false;
    }
};

/**
 * description: Function to get the cursor for next batch of persons to be updated
 * @returns {string} nextcursor - cursor for next batch of persons to be updated
 */
export const getNextCursor = async () => {
    try {
        const [nextCursor] = await bucket
            .file("next-cursor-shopify-partners-daily")
            .download();
        return nextCursor.toString();
    } catch (error) {
        console.log("Error getting next cursor from cloud storage", error);
        return null;
    }
};
