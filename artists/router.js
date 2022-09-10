const artists = require('./artists')
const express = require('express');
const router = express.Router();

router.get('/', async function (req, res, next) {
    const params = {
        limit: req.query.limit,
        offset: req.query.offset
    }

    console.log('Get Artists')
    console.log(params)

    const artistsList = await artists.listArtists(params);

    console.log('Found')
    console.log(artistsList)

    res.send(artistsList)
});

router.get('/:id', async function (req, res, next) {
    const params = {
        id: req.params.id,
    }

    if (!params.id) {
        res.status(400);
        res.send({ error: 'Invalid Params: id is required.' });

        return next()
    }

    console.log('Get Artist')
    console.log(params)

    const artist = await artists.getArtist(params);

    console.log('Found')
    console.log(artist)

    res.send(artist)
});

module.exports = router;
