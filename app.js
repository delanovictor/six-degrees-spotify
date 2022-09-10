const express = require('express');
const app = express();

const path = require('path');

const logger = require('morgan');

const artistsRouter = require('./artists/router');
const networkRouter = require('./network/router');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/artists', artistsRouter);
app.use('/network', networkRouter);

module.exports = app;

if (!module.parent) {
    app.listen(3000);
    console.log('Express started on port 3000');
}