const express = require('express');
const app = express();

const path = require('path');

const logger = require('morgan');

const artistsRouter = require('./components/artists/router');
const connectionRouter = require('./components/connection/router');

app.use(logger('dev'));
app.use(express.json());

app.use('/artists', artistsRouter);
app.use('/connection', connectionRouter);

module.exports = app;

if (!module.parent) {
    app.listen(3000);
    console.log('Express started on port 3000');
}