const connection = require('./connection')
const express = require('express');
const router = express.Router();

router.get('/', async function (req, res, next) {
    const params = {
        start: req.query.start,
        end: req.query.end,
        remix: req.query.remix,
        ignoreArtist: req.query.ignore_artist,
        ignoreTrack: req.query.ignore_track,
    }

    if (!params.start || !params.end) {
        res.status(400);
        res.send({ error: 'Invalid Params: start and end node are required.' });

        return next()
    }

    console.log('Get Path')
    console.log(params)

    const path = await connection.getPath(params);

    console.log('Found')
    console.log(path)

    res.send(path)
});


module.exports = router;
