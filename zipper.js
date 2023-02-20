import { exec } from "child_process";

const makePackageToRunInGCP = () => {
    exec(
        "zip -r pull-app-events-from-shopify-partners.zip helpers projectConfig slack storage .env app.js package.json twperm.json",
        (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("Zip File Created Successfully");
        }
    );
};

makePackageToRunInGCP();
