// dependencies
const http = require('node:http');
const environment = require('./helpers/environments');
const { handleReqRes } = require('./helpers/handleReqRes');
const data = require('./lib/data');

// app object - module scaffolding
const app = {};

// testing file system
// @TODO: Remove it later
// data.create('test', 'newFile', { name: 'bangladesh', lan: 'ban' }, (err) => {
//     console.log(`error was ${err}`);
// });

// data.read('test', 'newFile', (err, result) => {
//     console.log(err, result);
// });

data.update('test', 'newFile', { name: 'sua', lan: 'ar' }, (err) => {
    console.log(err);
});

data.delete('test', 'newFile', (err) => {
    console.log(err);
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
