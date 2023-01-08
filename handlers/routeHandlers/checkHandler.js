// dependencies
const data = require('../../lib/data');
const { hash, parseJSON } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');
// module scaffolding

const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    // checking method is allowed or not
    if (acceptedMethods.includes(requestProperties.method)) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

// function reuse
const isPhoneNumberValid = (phoneNumber) =>
    typeof phoneNumber === 'string' && phoneNumber.trim().length === 11 ? phoneNumber : null;

handler._check.get = (requestProperties, callback) => {};
handler._check.post = (requestProperties, callback) => {};

handler._check.put = (requestProperties, callback) => {};
handler._check.delete = (requestProperties, callback) => {};

module.exports = handler;
