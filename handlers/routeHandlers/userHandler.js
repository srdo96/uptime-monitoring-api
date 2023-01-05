// dependencies
const data = require('../../lib/data');
// module scaffolding

const handler = {};

handler.userHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    // checking method is allowed or not
    if (acceptedMethods.includes(requestProperties.method)) {
        handler._users[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._users = {};

handler._users.get = (requestProperties, callback) => {
    callback(200);
};
handler._users.post = (requestProperties, callback) => {
    const firstName =
        typeof requestProperties.body.firstName === 'string' &&
        requestProperties.body.firstName.trim().length > 0
            ? requestProperties.body.firstName
            : null;

    const lastName =
        typeof requestProperties.body.lastName === 'string' &&
        requestProperties.body.lastName.trim().length > 0
            ? requestProperties.body.lastName
            : null;
    const phoneNumber =
        typeof requestProperties.body.phoneNumber === 'string' &&
        requestProperties.body.phoneNumber.trim().length === 11
            ? requestProperties.body.phoneNumber
            : null;

    const password =
        typeof requestProperties.body.password === 'string' &&
        requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : null;

    const tosAgreement =
        typeof requestProperties.body.tosAgreement === 'string' &&
        requestProperties.body.tosAgreement.trim().length > 0
            ? requestProperties.body.tosAgreement
            : false;

    if (firstName && lastName && phoneNumber && password && tosAgreement) {
        // make sure that user  doesn't already exists
        data.read('users', phoneNumber, (err, user) => {
            if (err) {
                const userObject = {
                    firstName,
                    lastName,
                    phoneNumber,
                    password,
                    tosAgreement,
                };
            } else {
                callback(500, {
                    error: 'There is a problem in server side',
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request',
        });
    }
};

handler._users.put = (requestProperties, callback) => {};
handler._users.delete = (requestProperties, callback) => {};

module.exports = handler;
