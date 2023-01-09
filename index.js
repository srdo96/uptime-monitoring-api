// dependencies
const http = require('node:http');
const environment = require('./helpers/environments');
const { handleReqRes } = require('./helpers/handleReqRes');
const { sendTwilioSMS } = require('./helpers/notifications');
// app object - module scaffolding
const app = {};

// @TODO: remove later
sendTwilioSMS('01675959024', 'Hello from sakib', (err) => {
    console.log('this is error', err);
});
// create server
app.createServer = () => {
    const server = http.createServer(app.handleReqRes);
    server.listen(environment.port, () => {
        console.log(`listing to port ${environment.port}`);
    });
};

// handle Request Response
app.handleReqRes = handleReqRes;

// start the server
app.createServer();
