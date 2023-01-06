// dependencies
const fs = require('node:fs');
const { hash, createRandomString, parseJSON } = require('../../helpers/utilities');
const data = require('../../lib/data');

// module scaffolding
const handler = {};
handler._token = {};

handler.tokenHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'delete', 'put'];

    if (acceptedMethods.includes(requestProperties.method)) {
        handler._token[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._token.get = (requestProperties, callback) => {
    // check the token id is valid
    const tokenId =
        typeof requestProperties.queryStringObject.id === 'string' &&
        requestProperties.queryStringObject.id.trim().length === 22
            ? requestProperties.queryStringObject.id
            : null;

    if (tokenId) {
        data.read('tokens', tokenId, (err1, tokenData) => {
            const parsedTokenData = { ...parseJSON(tokenData) };
            if (!err1 && tokenData) {
                callback(200, parsedTokenData);
            } else {
                callback(404, { error: 'Token not found' });
            }
        });
    } else {
        callback(404, { error: 'Token was not found' });
    }
};

handler._token.post = (requestProperties, callback) => {
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

    if (phoneNumber && password) {
        data.read('users', phoneNumber, (err1, userData) => {
            if (!err1 && userData) {
                const user = parseJSON(userData);
                const hashedPassword = hash(password);
                if (hashedPassword === user.password) {
                    const tokenId = createRandomString(22);
                    // Token will expires after one hour
                    const expires = Date.now() + 60 * 60 * 1000;
                    const tokenObj = {
                        phoneNumber,
                        tokenId,
                        expires,
                    };

                    // store the token
                    data.create('tokens', tokenId, tokenObj, (err2) => {
                        if (!err2) {
                            callback(200, tokenObj);
                        } else {
                            callback(500, { error: 'Server side problem' });
                        }
                    });
                } else {
                    callback(400, { error: 'User id or password is not valid' });
                }
            } else {
                callback(400, { error: 'User id or password is not valid' });
            }
        });
    } else {
        callback(400, { error: 'Request not valid' });
    }
};

handler._token.put = (requestProperties, callback) => {};
handler._token.delete = (requestProperties, callback) => {};

// module export
module.exports = handler;
