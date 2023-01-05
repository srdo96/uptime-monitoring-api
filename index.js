// dependencies
const http = require('node:http');
const environment = require('./helpers/environments');
const { handleReqRes } = require('./helpers/handleReqRes');
const data = require('./lib/data');

// app object - module scaffolding
const app = {};

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
