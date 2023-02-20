// how many events to fetch in one go (Increasing this number would increase the complexity of the query so make sure it is not too high)
export const batchSize = 100;

// project id of the google cloud project - used in reporting and for storage of next cursor
export const projectId = "triple-whale-ops";

// name of the cloud function - used in reporting
export const functionName = "pull-app-events-from-shopify-partners";
