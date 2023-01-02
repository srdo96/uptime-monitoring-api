// module scaffolding
const handler = {};

handler.sampleHandler = (requestProperties, callback) => {
    callback(200, {
        message: 'this is a sample url',
    });
};

module.exports = handler;
