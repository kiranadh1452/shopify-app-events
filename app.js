import { postMsg } from "./helpers/shopifyPartnersFetcher.js";

let batchSize = 200;
let after = "";

const run = async () => {
    let hasNext = true;
    let count = 0;
    while (hasNext && count < 2) {
        const { records, cursor, hasNextPage } = await postMsg(
            batchSize,
            after
        );
        console.log("Has next page ? ", hasNextPage);
        console.log("Cursor: ", cursor);
        console.log("Records size: ", records.length);

        // updating cursor and next page indicator
        after = cursor;
        hasNext = hasNextPage;
        count++;
    }
};
run();
