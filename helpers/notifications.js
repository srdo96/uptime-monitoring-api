// dependencies
const https = require('node:https');
const querystring = require('node:querystring');
const { twilio } = require('./environments');

// module scaffolding
const notifications = {};

// send sms to user using twilio api
notifications.sendTwilioSMS = (phoneNumber, message, callback) => {
    // input validation
    const userPhoneNumber =
        typeof phoneNumber === 'string' && phoneNumber.trim().length === 11 ? phoneNumber : null;
    const userMessage =
        typeof message === 'string' && message.trim().length <= 1600 ? message.trim() : null;

    if (userPhoneNumber && userMessage) {
        // configure the request payload
        const payload = {
            From: twilio.from,
            To: `+88${userPhoneNumber}`,
            Body: userMessage,
        };

        // stringify the payload
        const stringifyPayload = querystring.stringify(payload);

        // configure teh request details
        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        // instantiate the request object
        const req = https.request(requestDetails, (res) => {
            //  get the status of the sent request
            const status = res.statusCode;
            // callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback(`Status code returned was ${status}`);
            }
        });

        req.on('error', (err) => {
            callback(err);
        });

        req.write(stringifyPayload);
        req.end();
    } else {
        callback('Phone Num or message not valid');
    }
};

// module export
module.exports = notifications;
