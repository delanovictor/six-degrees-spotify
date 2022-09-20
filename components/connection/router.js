const connection = require('./connection')
const express = require('express');
const router = express.Router();

router.get('/', async function (req, res, next) {
    try {
        const params = {
            start: req.query.start,
            end: req.query.end,
            remix: req.query.remix,
            excludeArtists: req.query.exclude_artists,
            excludeTracks: req.query.exclude_tracks,
            includeArtists: req.query.include_artists,
            includeTracks: req.query.include_tracks,
        }

        if (!params.start || !params.end) {
            res.status(400);
            res.send({ error: 'Invalid Params: start and end node are required.' });

            return next()
        }

        const path = await connection.getPath(params);

        res.send(path)

    } catch (e) {
        res.status(400);
        res.send({ error: e.message });
    }

});


module.exports = router;
