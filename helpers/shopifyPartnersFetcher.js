import axios from "axios";
import * as dotenv from "dotenv";
import { saveNextCursor } from "../storage/nextURLStorage.js";

dotenv.config();
const partnersUrl =
    "https://partners.shopify.com/924622/api/2023-01/graphql.json";

/**
 * description: This function fetches data from Shopify Partners API
 * @param {number} batchSize - number of records to fetch in a single request
 * @param {string} before - cursor to fetch the next batch of records
 * @param {number} attemptNumber - number of attempts made to fetch the current data
 */
export const fetchAppEvents = async (batchSize, before, attemptNumber = 0) => {
    try {
        const query = `
            query {
              app(id: "gid://partners/App/2753413") {
                apiKey
                id
                name
                events(last: ${batchSize}, before: "${before}") {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                  }
                  edges {
                    cursor
                    node{
                      shop {
                        id
                        myshopifyDomain
                      }
                      occurredAt
                      type
                      ... on CreditApplied {
                        appCredit {
                          id
                          amount{
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on CreditFailed {
                        appCredit {
                          id
                          amount{
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on CreditPending {
                        appCredit {
                          id
                          amount{
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on OneTimeChargeAccepted {
                        charge {
                          id
                          amount {
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on OneTimeChargeActivated {
                        charge {
                          id
                          amount {
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on OneTimeChargeDeclined {
                        charge {
                          id
                          amount {
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on OneTimeChargeExpired {
                        charge {
                          id
                          amount {
                            amount
                          }
                          name
                          test
                        }
                      }
                      ... on SubscriptionChargeAccepted {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on SubscriptionChargeActivated {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on SubscriptionChargeCanceled {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on SubscriptionChargeDeclined {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on SubscriptionChargeExpired {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on SubscriptionChargeUnfrozen {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on SubscriptionChargeFrozen {
                        charge {
                          id
                          amount {
                            amount
                          }
                          billingOn
                          test
                        }
                      }
                      ... on UsageChargeApplied {
                        charge {
                          id
                          amount {
                            amount
                          }
                          name
                          test
                        }
                      }
                    }
                  }
                }
              }
            }
`;

        // creating headers to attach to the post request
        const headers = {
            "X-Shopify-Access-Token": process.env.SHOPIFY_PARTNERS_ACCESS_TOKEN,
        };

        // creating data to send in the post request
        const dataToPost = {
            query: query,
            variables: {},
        };

        const response = await axios.post(partnersUrl, dataToPost, { headers });

        const { data } = response;

        // check if data has errors
        if (data.errors) {
            // first of all, check the number of attempts
            if (attemptNumber > 3) {
                // if we have already tried 3 times for the same batch, then throw an error
                throw new Error(
                    `Ran into max no. of attempts to fetch data for cusor ${before}`
                );
            }

            // get the error extension code and message for the first error
            const errorCode = data.errors[0].extensions?.code;
            const firstErrorMessage = data.errors[0].message;

            // if the error code is 429, it means we have exceeded the rate limit
            if (errorCode == 429) {
                // wait for 1 second and try again
                await new Promise((resolve) => setTimeout(resolve, 1000));
                return await fetchAppEvents(
                    batchSize,
                    before,
                    attemptNumber + 1
                );
            }

            // if the message says our query exceeds the max complexity, then we need to reduce the batch size
            if (firstErrorMessage.includes("exceeds max complexity")) {
                // reduce the batch size by one fourth and try again
                console.log(`Reducing the batch size to: ${batchSize / 4}`);
                return await fetchAppEvents(
                    batchSize / 4,
                    before,
                    attemptNumber + 1
                );
            }

            /**
             * For now, the above two errors are the main errors that were found and are handled.
             */
            const combinedErrorMessage = data.errors
                .map((err) => err.message)
                .join(" ** ");
            throw new Error(combinedErrorMessage);
        }

        // get the records and the next page status
        const records = data.data?.app?.events?.edges;
        const hasPreviousPage = data.data?.app?.events?.pageInfo?.hasPreviousPage;

        console.log("Response status: ", response.status);
        return {
            records,
            cursor: records[0]?.cursor,
            hasPreviousPage,
        };
    } catch (error) {
        console.log("Saving cursor before throwing error");
        await saveNextCursor(before);
        console.log("Saved");
        throw new Error(error);
    }
};
