const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const axios = require('axios')
const _ = require('lodash/array')

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

async function searchArtist(params) {
    try {
        if (!params.artist.id && !params.artist.name)
            return

        if (params.artist.id) {
            return params
        }

        const searchArtistResponse = await axios({
            method: 'GET',
            url: `${process.env.SPOTIFY_ENDPOINT}search`,
            params: {
                q: params.artist.name,
                type: 'artist',
                market: 'BR'
            },
            headers: {
                'Authorization': `Bearer ${params.authToken}`
            }
        });

        if (searchArtistResponse.data.artists.items.length == 0) {
            return
        }

        const searchedArtist = searchArtistResponse.data.artists.items[0]

        params.artist.id = searchedArtist.id

        return params
    } catch (err) {
        console.log(err)
        console.log('Erro ao procurar o artista')

    }
}

async function getArtist(params) {
    try {
        if (!params.artist.id)
            return


        const getArtistResponse = await axios({
            method: 'GET',
            url: `${process.env.SPOTIFY_ENDPOINT}artists/${params.artist.id}`,
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

        params.artist = {
            id: artistData.id,
            name: artistData.name,
            image: artistData.images[0]?.url,
            link: artistData.external_urls.spotify
        }

        return params
    } catch (err) {
        console.log(err)
        console.log('Erro ao pegar o artista')
        console.log(params)

    }
}

async function getArtistAlbums(params) {
    try {
        const artist = params.artist

        //Get all albuns
        const albumsSearch = await requestPaginationLoop({
            method: 'GET',
            url: `${process.env.SPOTIFY_ENDPOINT}artists/${artist.id}/albums`,
            params: {
                market: 'BR',
                limit: 50
            },
            headers: {
                'Authorization': `Bearer ${params.authToken}`
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
                    link: albumItem.external_urls.spotify
                }

                albumItemMapped.tracks = albumItem.tracks.items.map(trackItem => {
                    return {
                        id: trackItem.id,
                        name: trackItem.name,
                        link: trackItem.external_urls.spotify,
                        image: albumItem.images[0]?.url,
                        preview: trackItem.preview_url,
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

        params.artistAlbums = albumsData

        return params
    } catch (err) {
        console.log(err)
        console.log('Erro ao pegar albums')

    }
}

async function requestPaginationLoop(config) {
    const finalResponse = []
    let step = config.params.limit
    config.params.offset = 0

    let currentResponse = await axios(config)

    if (!currentResponse.data)
        return currentResponse

    finalResponse.push(...currentResponse.data.items)

    while (currentResponse.data.total > currentResponse.data.limit + currentResponse.data.offset) {
        config.params.offset += Number(step)

        currentResponse = await axios(config)

        if (currentResponse.data)
            finalResponse.push(...currentResponse.data.items)
    }

    return finalResponse
}

async function getImportData(id) {
    try {
        let params = {
            artist: {
                id: id
            },
            collabsOnly: true,
            groupCollabs: true
        }

        params.authToken = await getToken()

        params = await searchArtist(params)

        if (!params) return

        params = await getArtist(params)

        if (!params) return

        params = await getArtistAlbums(params)

        if (!params) return


        const tracks = []

        const collabs = []

        for (const album of params.artistAlbums) {
            const albumTracks = []
            album.tracks.forEach(trackItem => {

                if (params.collabsOnly) {
                    if (trackItem.artists.length == 1)
                        return;


                    //TODO: melhorar isso
                    if (params.groupCollabs) {
                        let validTrack = false

                        trackItem.artists.forEach((artist, index) => {
                            if (artist.id == params.artist.id)
                                return

                            if (collabs.indexOf(artist.id) == -1) {
                                // console.log('esse artista é novo!')
                                // console.log('id: ' + artist.id)
                                collabs.push(artist.id)
                                validTrack = true
                            }
                        })

                        if (!validTrack) {
                            return
                        }
                    }
                }

                trackItem.albumId = album.id

                albumTracks.push(trackItem)
            })

            tracks.push(...albumTracks)
        }

        return {
            artist: params.artist,
            tracks: tracks,
            collabs: collabs
        }

    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    getImportData
}