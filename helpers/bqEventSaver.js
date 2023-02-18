import { BigQuery } from "@google-cloud/bigquery";

const bigqueryClient = new BigQuery({
    keyFilename: "twperm.json",
    projectId: "triple-whale-ops",
});

const datasetName = "shopify_partners";
const tableName = "app-records";

/**
 * description: This function restructures the records to be stored in bigquery
 * @param {array} records - array of records to be stored in bigquery
 * @returns {array} - array of restructured records
 */
const restructureRecords = (records) => {
    return records.map(
        ({ cursor, node: { shop, occurredAt, type, charge, appCredit } }) => ({
            cursor,
            shop,
            occurredAt,
            type,
            charge,
            appCredit,
        })
    );
};

/**
 * description: This function stores the records in bigquery
 * @param {array} records - array of records to be stored in bigquery
 * @returns {boolean} - true if records are stored successfully, false otherwise
 */
export const bqEventSaver = async (records) => {
    try {
        records = restructureRecords(records);

        await bigqueryClient
            .dataset(datasetName)
            .table(tableName)
            .insert(records);
        return true;
    } catch (error) {
        console.log(error?.errors[0]?.errors) || console.log(error);
        return false;
    }
};
