// dependencies
const data = require('../../lib/data');
const { hash, parseJSON } = require('../../helpers/utilities');
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
    // check the phone number is valid
    const phoneNumber =
        typeof requestProperties.queryStringObject.phoneNumber === 'string' &&
        requestProperties.queryStringObject.phoneNumber.trim().length === 11
            ? requestProperties.queryStringObject.phoneNumber
            : null;

    if (phoneNumber) {
        // lookup the user
        data.read('users', phoneNumber, (err, user) => {
            const userInfo = { ...parseJSON(user) };
            if (!err) {
                delete userInfo.password;
                callback(200, userInfo);
            } else {
                callback(404, {
                    error: 'Requested user is not found',
                });
            }
        });
    } else {
        callback(404, {
            error: 'Requested user is not found',
        });
    }
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
        typeof requestProperties.body.tosAgreement === 'boolean' &&
        requestProperties.body.tosAgreement
            ? requestProperties.body.tosAgreement
            : false;

    if (firstName && lastName && phoneNumber && password && tosAgreement) {
        // make sure that user  doesn't already exists
        data.read('users', phoneNumber, (err1) => {
            if (err1) {
                const userObject = {
                    firstName,
                    lastName,
                    phoneNumber,
                    password: hash(password),
                    tosAgreement,
                };
                data.create('users', phoneNumber, userObject, (err2) => {
                    if (!err2) {
                        callback(200, { message: 'User create successfully' });
                    } else {
                        callback(500, { error: 'could not create user' });
                    }
                });
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
