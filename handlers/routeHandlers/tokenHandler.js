// dependencies
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

// reuse function
const isTokenValid = (tokenId) =>
    typeof tokenId === 'string' && tokenId.trim().length === 22 ? tokenId : null;

handler._token.get = (requestProperties, callback) => {
    // check the token id is valid
    const tokenId = isTokenValid(requestProperties.queryStringObject.id);

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

handler._token.put = (requestProperties, callback) => {
    const tokenId = isTokenValid(requestProperties.body.tokenId);
    const extend = !!(
        typeof requestProperties.body.extend === 'boolean' && requestProperties.body.extend === true
    );

    if (tokenId && extend) {
        data.read('tokens', tokenId, (err1, tokenData) => {
            const tokenObj = parseJSON(tokenData);

            if (tokenObj.expires > Date.now()) {
                tokenObj.expires = Date.now() + 60 * 60 * 1000;

                // store token
                data.update('tokens', tokenId, tokenObj, (err2) => {
                    if (!err2) {
                        callback(200, { message: 'Time extend' });
                    } else {
                        callback(500, { error: 'server side error' });
                    }
                });
            } else {
                callback(400, { error: 'Token already expired' });
            }
        });
    } else {
        callback(400, { error: 'Request not valid' });
    }
};

handler._token.delete = (requestProperties, callback) => {
    // check the token validation
    const tokenId = isTokenValid(requestProperties.queryStringObject.id);

    if (tokenId) {
        data.read('tokens', tokenId, (err1, tokenData) => {
            if (!err1 && tokenData) {
                data.delete('tokens', tokenId, (err) => {
                    if (!err) {
                        callback(200, { message: 'Delete successfully' });
                    } else {
                        callback(500, { error: 'server side error' });
                    }
                });
            } else {
                callback(404, { error: 'Token not found' });
            }
        });
    } else {
        callback(400, { error: 'Request not valid' });
    }
};

handler._token.verify = (tokenId, phoneNumber, callback) => {
    data.read('tokens', tokenId, (err, tokenData) => {
        if (!err && tokenData) {
            const parsedToken = parseJSON(tokenData);

            if (parsedToken.phoneNumber === phoneNumber && parsedToken.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback('false a');
        }
    });
};

// module export
module.exports = handler;
