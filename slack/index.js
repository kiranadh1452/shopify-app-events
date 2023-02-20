import https from "https";
import * as dotenv from "dotenv";

dotenv.config();
const endpointSecret = process.env.SLACK_ENDPOINT_SECRET;

/**
 * description: This function sends a message to a slack channel
 * @param {string} message - the message to be sent to slack
 */
export const sendSlackMessage = async (message) => {
    const slackMessage = {
        text: message,
    };

    // creating the request options
    const options = {
        method: "POST",
        hostname: "hooks.slack.com",
        port: 443,
        path: `/services/${endpointSecret}`,
        headers: {
            "Content-Type": "application/json",
        },
    };

    // making the request
    const req = https.request(options, (res) => {
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
            console.log(`Response: ${chunk}`);
        });
        res.on("end", () => {
            console.log("Report sent to Slack");
        });
    });

    req.on("error", (e) => {
        console.error(`Problem with request: ${e.message}`);
    });
    req.write(JSON.stringify(slackMessage));
    req.end();
};
