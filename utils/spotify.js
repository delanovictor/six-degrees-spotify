const path = require('path')
const axios = require('axios')
const _ = require('lodash/array')
const genericID = '0LyfQWJT6nXafLPZqxe9Of'

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })


async function getToken() {
    const response = await axios({
        method: 'POST',
        url: `https://accounts.spotify.com/api/token`,
        params: {
            grant_type: 'client_credentials'
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_ID + ':' + process.env.SPOTIFY_SECRET).toString('base64'))
        }
    });

    if (response.data) {
        return response.data.access_token
    }
}

async function search(params) {
    try {
        if (!params.type)
            return

        if (!params.searchString) {
            return
        }

        const searchArtistResponse = await requestPaginationLoop({
            request: {
                method: 'GET',
                url: `${process.env.SPOTIFY_ENDPOINT}search`,
                params: {
                    q: params.searchString,
                    type: params.type,
                    market: 'BR',
                    limit: 50
                },
                headers: {
                    'Authorization': `Bearer ${params.authToken}`
                }
            },
            key: `${params.type}s`,
            limit: 100
        });

        return searchArtistResponse

    } catch (error) {

        if (error.response) {
            // Request made and server responded
            console.log(error.response.data);
            console.log(error.response.status);

            if (error.response.status == 400) {
                throw new Error(`${error.response.data.error.message}`)
            }
        } else {
            throw new Error(`Error in artist search`)
        }
    }

}

async function getArtist(params) {
    try {
        if (!params.id)
            throw new Error('id is undefined')


        const getArtistResponse = await axios({
            method: 'GET',
            url: `${process.env.SPOTIFY_ENDPOINT}artists/${params.id}`,
            params: {
                market: 'BR'
            },
            headers: {
                'Authorization': `Bearer ${params.authToken}`
            }
        });

        const artistData = getArtistResponse.data


        if (!artistData) {
            return
        }

        return {
            id: artistData.id,
            name: artistData.name,
            image: artistData.images[0]?.url,
            link: artistData.external_urls.spotify,
            followers: artistData.followers.total
        }
    } catch (error) {
        if (error.response) {
            // Request made and server responded
            if (error.response.status == 400) {
                console.log(params)
                throw new Error(`${error.response.data.error.message} - ${params.id}`)
            }
        } else {
            throw new Error(`Error getting artist`)
        }
    }
}

async function getArtistAlbums(params) {
    try {
        const artist = params.artist

        //Get all albuns
        const albumsSearch = await requestPaginationLoop({
            request: {
                method: 'GET',
                url: `${process.env.SPOTIFY_ENDPOINT}artists/${artist.id}/albums`,
                params: {
                    market: 'BR',
                    limit: 50
                },
                headers: {
                    'Authorization': `Bearer ${params.authToken}`
                }
            }
        })

        const albumList = []

        //Faster than map
        for (const item of albumsSearch) {
            albumList.push(item.id);
        }

        const maxArrayLength = 20;

        //Split the array of albums into smaller arrays
        const idBatchs = _.chunk(albumList, maxArrayLength)


        const albumsData = []

        //Make request in batches of 20
        for (const batch of idBatchs) {
            //Get all albuns
            const albumsResponse = await axios({
                method: 'GET',
                url: `${process.env.SPOTIFY_ENDPOINT}albums`,
                params: {
                    market: 'BR',
                    ids: batch.join(',') //Max 20
                },
                headers: {
                    'Authorization': `Bearer ${params.authToken}`
                }
            })

            const partialResponse = []

            albumsResponse.data.albums.forEach(albumItem => {
                const albumItemMapped = {
                    id: albumItem.id,
                    name: albumItem.name,
                    image: albumItem.images[0]?.url,
                    link: albumItem.external_urls.spotify,
                    artists: albumItem.artists
                }

                albumItemMapped.tracks = albumItem.tracks.items.map(trackItem => {
                    return {
                        id: trackItem.id,
                        name: trackItem.name,
                        link: trackItem.external_urls.spotify,
                        image: albumItem.images[0]?.url,
                        preview: trackItem.preview_url,
                        durationMS: trackItem.duration_ms,
                        artists: trackItem.artists.map(artistItem => {
                            return {
                                id: artistItem.id,
                                name: artistItem.name,

                            }
                        }),
                    }
                })

                //Remove tracks that the artist wasn't part of
                albumItemMapped.tracks = albumItemMapped.tracks.filter((_track) => {
                    return _track.artists.some(_artist => _artist.id == artist.id)
                })

                partialResponse.push(albumItemMapped)

            })

            albumsData.push(...partialResponse)
        }

        return albumsData
    } catch (error) {
        if (error.response) {
            // Request made and server responded
            console.log(error.response.data);
            console.log(error.response.status);

            if (error.response.status == 400) {
                throw new Error(`${error.response.data.error.message} - ${params.artist.id}`)
            }
        } else {
            throw new Error(`Error getting albums`)
        }

    }
}

async function requestPaginationLoop(config) {
    const finalResponse = []

    const requestConfig = config.request
    let step = requestConfig.params.limit

    requestConfig.params.offset = 0

    let currentResponse = await axios(requestConfig)

    if (!currentResponse.data)
        return currentResponse

    let currentData = []

    if (config.key) {
        currentData = currentResponse.data[config.key]
    } else {
        currentData = currentResponse.data
    }

    finalResponse.push(...currentData.items)

    while (currentData.total > currentData.limit + currentData.offset) {
        requestConfig.params.offset += Number(step)

        currentResponse = await axios(requestConfig)

        if (config.key) {
            currentData = currentResponse.data[config.key]
        } else {
            currentData = currentResponse.data
        }
        if (currentData) {
            finalResponse.push(...currentData.items)
        }

        if (config.limit) {
            if (finalResponse.length >= config.limit) {
                break
            }
        }
    }

    return finalResponse
}


module.exports = {
    getToken,
    search,
    getArtist,
    getArtistAlbums,
    genericID
}