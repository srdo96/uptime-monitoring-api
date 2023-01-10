// dependencies
const url = require('node:url');
const http = require('node:http');
const https = require('node:https');
const { parseJSON } = require('../helpers/utilities');
const { sendTwilioSMS } = require('../helpers/notifications');
const data = require('./data');

// worker object - module scaffolding
const worker = {};

// validate data
worker.validateCheckData = (originalCheckData) => {
    const checkData = { ...originalCheckData };
    if (checkData && checkData.id) {
        checkData.state =
            typeof checkData.state === 'string' && ['up', 'down'].includes(checkData.state)
                ? checkData.state
                : 'down';
        checkData.lastChecked =
            typeof checkData.lastChecked === 'number' && checkData.lastChecked > 0
                ? checkData.lastChecked
                : false;
        // pass to the next process
        worker.performCheck(checkData);
    } else {
        console.log('Error: Check was invalid or not properly formatted');
    }
};

worker.performCheck = (checkData) => {
    // prepare the initial check outcome
    const checkOutCome = {
        error: false,
        value: '',
    };
    // mark the outcome has not been sent yet
    let outcomeSent = false;
    // parsed the host name from data
    const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true);
    // const newURL = new URL(parsedUrl);
    // console.log({ newURL });
    // const hostName = parsedUrl.hostname;
    // path give you query string also
    const { path, hostname } = parsedUrl;

    // construct the request
    const requestDetails = {
        protocol: `${parsedUrl.protocol}`,
        hostname,
        method: checkData.method.toUpperCase(),
        path,
        timeOutSec: checkData.timeOutSec * 1000,
    };

    const protocolToUse = checkData.protocol === 'http' ? http : https;
    const req = protocolToUse.request(requestDetails, (res) => {
        // grab the status of the response
        checkOutCome.responseCode = res.statusCode;
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutCome);
            outcomeSent = true;
        }
    });

    req.on('error', (err) => {
        checkOutCome.error = true;
        checkOutCome.value = err;
        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutCome);
            outcomeSent = true;
        }
    });

    req.on('timeout', () => {
        checkOutCome.error = true;
        checkOutCome.value = 'timeout';

        if (!outcomeSent) {
            worker.processCheckOutcome(checkData, checkOutCome);
            outcomeSent = true;
        }
    });
    req.end();
};

// save check outcome to database and send to next process
worker.processCheckOutcome = (checkData, checkOutCome) => {
    const state =
        !checkOutCome.error &&
        checkOutCome.responseCode &&
        checkData.successCodes.includes(checkOutCome.responseCode)
            ? 'up'
            : 'down';

    const alertWanted = !!(checkData.lastChecked && checkData.state !== state);
    const newCheckData = { ...checkData };
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWanted) {
                worker.alertUserToStatusChange(newCheckData);
            } else {
                console.log('No need to alert');
            }
        } else {
            console.log('Error: While update checks', err);
        }
    });
};

// send sms notification sms to user if state changes
worker.alertUserToStatusChange = (newCheckData) => {
    const massage = `Alert: Your check for ${newCheckData.url} is currently ${newCheckData.state}`;
    sendTwilioSMS(newCheckData.userPhone, massage, (err) => {
        if (err) {
            console.log('SMS successfully send', massage);
        } else {
            console.log('Sending SMS failed', err);
        }
    });
};

// lookup all the checks
worker.gatherAllChecks = () => {
    // get all the checks
    data.list('checks', (err1, checksList) => {
        if (!err1 && checksList.length > 0) {
            checksList.forEach((check) => {
                // read the check data
                data.read('checks', check, (err2, checkData) => {
                    if (!err2 && checkData) {
                        worker.validateCheckData(parseJSON(checkData));
                    } else {
                        console.log(`Error: problem to read this check: ${check}`);
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process');
        }
    });
};

// timer to execute the worker process one per minute
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks();
    }, 5000);
    // 1000 * 60 for 5 sec
};
// start the worker
worker.init = () => {
    // execute all the checks
    worker.gatherAllChecks();

    // call the loop so that checks continue
    worker.loop();
};

// module export
module.exports = worker;
