// module handler
const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
    callback(404, {
        message: 'Your requested url is not found!',
    });
};

module.exports = handler;
