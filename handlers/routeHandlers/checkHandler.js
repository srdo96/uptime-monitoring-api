// dependencies
const data = require('../../lib/data');
const { parseJSON, createRandomString } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');
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

const isTokenValid = (tokenId) =>
    typeof tokenId === 'string' && tokenId.trim().length === 22 ? tokenId : null;

const requestPropertiesValidityCheck = (requestProperties) => {
    const reqProtocol = requestProperties.body.protocol;
    const protocol =
        typeof reqProtocol === 'string' && ['http', 'https'].includes(reqProtocol.trim())
            ? reqProtocol.trim()
            : false;

    const reqUrl = requestProperties.body.url;
    const url = typeof reqUrl === 'string' && reqUrl.trim().length > 0 ? reqUrl.trim() : false;
    const reqMethod = requestProperties.body.method;
    const method =
        typeof reqMethod === 'string' && ['get', 'post', 'put', 'delete'].includes(reqMethod.trim())
            ? reqMethod.trim()
            : false;

    const reqSuccessCodes = requestProperties.body.successCodes;
    const successCodes =
        typeof reqSuccessCodes === 'object' && Array.isArray(reqSuccessCodes)
            ? reqSuccessCodes
            : false;

    const reqTimeOutSec = requestProperties.body.timeOutSec;
    const timeOutSec =
        typeof reqTimeOutSec === 'number' &&
        reqTimeOutSec % 1 === 0 &&
        reqTimeOutSec >= 1 &&
        reqTimeOutSec <= 5
            ? reqTimeOutSec
            : false;
    return { protocol, url, method, successCodes, timeOutSec };
};

handler._check.get = (requestProperties, callback) => {
    // check the token id is valid
    const token = isTokenValid(requestProperties.queryStringObject.id);

    if (token) {
        data.read('checks', token, (err1, checkData) => {
            if (!err1 && checkData) {
                const parsedTokenData = { ...parseJSON(checkData) };
                tokenHandler._token.verify(token, parsedTokenData.phoneNumber, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, parsedTokenData);
                    } else {
                        callback(403, 'Authentication failure');
                    }
                });
            } else {
                callback(404, { error: 'Token not found' });
            }
        });
    } else {
        callback(404, { error: 'Token was not found' });
    }
};

// _check POST
handler._check.post = (requestProperties, callback) => {
    // validate inputs
    const { protocol, url, method, successCodes, timeOutSec } =
        requestPropertiesValidityCheck(requestProperties);

    if (protocol && url && method && successCodes && timeOutSec) {
        const tokenId = isTokenValid(requestProperties.headersObject.token);

        data.read('tokens', tokenId, (err1, tokenData) => {
            if (!err1 && tokenData) {
                const { phoneNumber } = parseJSON(tokenData);
                data.read('users', phoneNumber, (err2, userData) => {
                    if (!err2 && userData) {
                        tokenHandler._token.verify(tokenId, phoneNumber, (tokenIsValid) => {
                            if (tokenIsValid) {
                                const userObject = parseJSON(userData);
                                const userChecks =
                                    typeof userObject.checks === 'object' &&
                                    Array.isArray(userObject)
                                        ? userObject.checks
                                        : [];

                                if (userChecks.length < maxChecks) {
                                    const checkId = createRandomString(22);
                                    const checkObject = {
                                        id: checkId,
                                        userPhone: phoneNumber,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeOutSec,
                                    };
                                    // save the object
                                    data.create('checks', checkId, checkObject, (err3) => {
                                        if (!err3) {
                                            // add check id to the user's object
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);
                                            // save the new user data
                                            data.update(
                                                'users',
                                                phoneNumber,
                                                userObject,
                                                (err4) => {
                                                    if (!err4) {
                                                        callback(200, checkObject);
                                                    } else {
                                                        callback(500, {
                                                            error: 'server side error',
                                                        });
                                                    }
                                                }
                                            );
                                        } else {
                                            callback(500, { error: 'server side error' });
                                        }
                                    });
                                } else {
                                    callback(401, { error: 'User already reacher limit' });
                                }
                            } else {
                                callback(403, { error: 'Authentication problem' });
                            }
                        });
                    } else {
                        callback(403, { error: 'User not found' });
                    }
                });
            } else {
                callback(403, { error: 'Authentication problem' });
            }
        });
    } else {
        callback(400, { error: 'Request not valid' });
    }
};

handler._check.put = (requestProperties, callback) => {
    const token = isTokenValid(requestProperties.body.id);
    const { protocol, url, method, successCodes, timeOutSec } =
        requestPropertiesValidityCheck(requestProperties);
    if (token) {
        if (protocol || url || method || successCodes || timeOutSec) {
            data.read('checks', token, (err1, checkData) => {
                if (!err1 && checkData) {
                    const checkObject = parseJSON(checkData);
                    const tokenId = isTokenValid(requestProperties.headersObject.token);

                    tokenHandler._token.verify(tokenId, checkObject.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (successCodes) {
                                checkObject.successCodes = successCodes;
                            }
                            if (timeOutSec) {
                                checkObject.timeOutSec = timeOutSec;
                            }

                            // store the checkObject
                            data.update('checks', token, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200);
                                } else {
                                    callback(500, { error: 'Server side error' });
                                }
                            });
                        } else {
                            callback(403, { error: 'Authentication error' });
                        }
                    });
                } else {
                    callback(404, { error: 'Data not found' });
                }
            });
        } else {
            callback(400, { error: 'Empty field not allowed to update' });
        }
    } else {
        callback(400, { error: 'Token not valid' });
    }
};
handler._check.delete = (requestProperties, callback) => {};

module.exports = handler;
