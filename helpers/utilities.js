// dependencies
const crypto = require('node:crypto');
const environments = require('./environments');
// module scaffolding
const utilities = {};

// parse JSON string to object
utilities.parseJSON = (jsonString) => {
    let output;
    try {
        output = JSON.parse(jsonString);
    } catch {
        output = {};
    }
    return output;
};

// hash string
utilities.hash = (str) => {
    const hashKey = crypto.createHmac('sha256', environments.secret_key).update(str).digest('hex');

    return hashKey;
};

// random string
utilities.createRandomString = (length) => {
    const strLength = length;
    // each byte encoded to hex is 2 characters. So the resulting string will be twice
    const randomString = crypto.randomBytes(strLength / 2).toString('hex');
    return randomString;
};

// module export
module.exports = utilities;
