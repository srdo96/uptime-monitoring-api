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

// function reuse
const isPhoneNumberValid = (phoneNumber) =>
    typeof phoneNumber === 'string' && phoneNumber.trim().length === 11 ? phoneNumber : null;

handler._users.get = (requestProperties, callback) => {
    // check the phone number is valid
    const phoneNumber = isPhoneNumberValid(requestProperties.queryStringObject.phoneNumber);

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

    const phoneNumber = isPhoneNumberValid(requestProperties.queryStringObject.phoneNumber);

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

handler._users.put = (requestProperties, callback) => {
    // check the phone-number validation
    const phoneNumber = isPhoneNumberValid(requestProperties.queryStringObject.phoneNumber);

    if (phoneNumber) {
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

        const password =
            typeof requestProperties.body.password === 'string' &&
            requestProperties.body.password.trim().length > 0
                ? requestProperties.body.password
                : null;

        if (firstName || lastName || password) {
            // lookup the user
            data.read('users', phoneNumber, (err1, userData) => {
                const user = { ...parseJSON(userData) };
                if (!err1 && user) {
                    if (firstName) {
                        user.firstName = firstName;
                    }
                    if (lastName) {
                        user.lastName = lastName;
                    }
                    if (password) {
                        user.password = hash(password);
                    }
                    // update database or local storage
                    data.update('users', phoneNumber, user, (err2) => {
                        if (!err2) {
                            callback(200, {
                                message: 'User info update successfully',
                            });
                        } else {
                            callback(500, { error: 'There is a problem in the server side' });
                        }
                    });
                } else {
                    callback(400, { error: 'Invalid request, Try again' });
                }
            });
        } else {
            callback(400, {
                error: 'Invalid request. Try again',
            });
        }
    } else {
        callback(400, {
            error: 'Invalid phone number. Please try again',
        });
    }
};
handler._users.delete = (requestProperties, callback) => {
    // check the phone-number validation
    const phoneNumber = isPhoneNumberValid(requestProperties.queryStringObject.phoneNumber);

    if (phoneNumber) {
        data.read('users', phoneNumber, (err1, userData) => {
            if (!err1 && userData) {
                data.delete('users', phoneNumber, (err2) => {
                    if (!err2) {
                        callback(200, { message: 'Delete Successfully' });
                    } else {
                        callback(500, { error: 'There was a server side error' });
                    }
                });
            } else {
                callback(500, { error: 'There was a server side error' });
            }
        });
    } else {
        callback(400, { error: 'There is a problem in your request' });
    }
};

module.exports = handler;
