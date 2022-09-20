const artists = require('./artists')
const express = require('express');
const router = express.Router();


router.get('/', async function (req, res, next) {
    const params = {
        limit: req.query.limit,
        offset: req.query.offset
    }


    const artistsList = await artists.listArtists(params);

    res.send(artistsList)
});

router.get('/search', async function (req, res, next) {
    if (!req.query.str) {
        res.status(400);
        res.send({ error: 'Invalid Params: str required.' });
    }

    const params = {
        searchString: req.query.str
    }

    if (req.query.api_search) {
        if (req.query.api_search === 'true') {
            params.isAPISearch = true
        } else if (req.query.api_search === 'false') {
            params.isAPISearch = false
        } else {
            //Possible error
            params.isAPISearch = false
        }
    }

    const result = await artists.searchArtists(params);

    res.send(result)
});

router.post('/import', async function (req, res, next) {
    try {
        const importQueue = []

        if (typeof req.body.id == 'string') {
            importQueue.push(req.body.id)
        } else if (Array.isArray(req.body.id)) {
            importQueue.push(...req.body.id)
        }

        if (importQueue.length === 0) {
            res.status(400);
            res.send({ error: 'Invalid Params: id is required.' });
        }

        const responses = []


        //TODO: Make background jobs the right way
        if (req.body.background === true) {
            setTimeout(async () => {
                for (const id of importQueue) {
                    const _resp = await artists.importArtist(id)
                    responses.push(_resp)
                }
                console.log(responses)
            }, 500)

            res.send(importQueue.map(item => {
                return {
                    id: item,
                    status: 'Scheduled'
                }
            }))

        } else {
            for (const id of importQueue) {
                const _resp = await artists.importArtist(id)
                responses.push(_resp)
            }

            res.send(responses)
        }


    } catch (e) {
        console.log(e)
        res.status(400);
        res.send(e.message)
    }
});

router.get('/:id', async function (req, res, next) {
    const id = req.params.id

    if (!id) {
        res.status(400);
        res.send({ error: 'Invalid Params: id is required.' });

        return next()
    }

    const artist = await artists.getArtist(id);

    res.send(artist)
});

module.exports = router;
