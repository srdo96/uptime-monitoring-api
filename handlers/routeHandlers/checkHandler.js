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
    const reqProtocol = requestProperties.body.protocol;
    const protocol =
        typeof reqProtocol === 'string' && ['http', 'https'].includes(reqProtocol)
            ? reqProtocol
            : false;

    const reqUrl = requestProperties.body.url.trim();
    const url = typeof reqUrl === 'string' && reqUrl.length > 0 ? reqUrl : false;
    const reqMethod = requestProperties.body.method.trim();
    const method =
        typeof reqMethod === 'string' && ['get', 'post', 'put', 'delete'].includes(reqMethod)
            ? reqMethod
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

handler._check.put = (requestProperties, callback) => {};
handler._check.delete = (requestProperties, callback) => {};

module.exports = handler;
