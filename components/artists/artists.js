const database = require('../../services/db')
const neo4j = require('neo4j-driver')
const spotify = require('../../utils/spotify')
const _ = require('lodash/array')

async function searchArtists({ searchString, isAPISearch }) {

    if (isAPISearch) {
        const token = await spotify.getToken();

        const searchResult = await spotify.search({
            type: 'artist',
            searchString: searchString,
            authToken: token
        })

        return searchResult.map((item => {
            return {
                name: item.name,
                id: item.id,
                followers: item.followers.total,
                image: item.images[0]?.url
            }
        }))
    } else {

        const session = database.getConnection()
        const result = []

        const query = `MATCH(n: Artist)
                   WHERE n.name =~ "(?i).*" + $search + ".*"
                   RETURN n`

        const readResult = await session.executeRead(tx =>
            tx.run(query, { search: searchString })
        );

        await session.close();


        readResult.records.forEach(record => {
            if (record && record._fields) {
                result.push(record._fields[0].properties)
            }
        })

        return result
    }
}

async function getArtist(id) {
    const session = database.getConnection()

    const query = `MATCH (a:Artist{id:$id})
                   RETURN (a)`

    const readResult = await session.executeRead(tx =>
        tx.run(query, { id: id })
    );

    await session.close();

    if (!readResult.records[0])
        return null

    const artistNode = readResult.records[0]._fields[0]

    const artistProperties = artistNode.properties

    return artistProperties
}

async function listArtists({ limit = 100, offset = 0 }) {
    const session = database.getConnection()
    const artistList = []

    const query = `MATCH (a:Artist)
                   RETURN a
                   ORDER BY (a.name)
                   SKIP $offset
                   LIMIT $limit`

    const readResult = await session.executeRead(tx =>
        tx.run(query, { limit: neo4j.int(limit), offset: neo4j.int(offset) })
    );

    await session.close();

    if (readResult.records.length == 0)
        return artistList


    readResult.records.forEach(record => {
        if (record && record._fields) {
            artistList.push(record._fields[0].properties)
        }
    })

    return artistList
}

async function importArtist(id) {
    const session = database.getConnection()

    if (await getArtist(id)) {
        return {
            artist: id,
            status: 'Already Imported'
        }
    }
    const inputData = await _getImportData(id)

    if (inputData.errorCode)
        return inputData

    console.log(`Insert Artist ${inputData.artist.name}`)

    const createArtistQuery = `// 1 -
                        UNWIND $inputData AS value

                        // ======== CREATE ARTIST ==========
                        MERGE (a1:Artist {
                            id: value.id
                        })
                        SET a1.name = value.name, a1.image = value.image, 
                            a1.link = value.link, a1.followers = value.followers, a1.compilation = value.compilation
        `
    const writeResult1 = await session.executeWrite(tx =>
        tx.run(createArtistQuery, { inputData: inputData.artist })
    );

    const trackBatches = _.chunk(inputData.tracks, 50)

    for (const trackBatch of trackBatches) {
        console.log(`Insert Tracks ${inputData.artist.name}`)
        const createTracksQuery = `
                                    UNWIND $inputData AS value

                                    FOREACH (track in value.tracks |

                                        // ======== CREATE TRACK ==========
                                        MERGE (t:Track {
                                            id: track.id
                                        })
                                        ON CREATE SET 
                                        t += track { .name, .albumId, .link, .image, .preview }

                                        // ======== LINK ARTISTS TO TRACK ==========
                                        FOREACH (artist in track.artists |
                                            MERGE (a:Artist {id: artist.id})
                                            ON CREATE SET a.name = artist.name
                                            MERGE (a)-[:PERFORMED]->(t)
                                        )
                                    )
                                 `;

        const writeResult2 = await session.executeWrite(tx =>
            tx.run(createTracksQuery, {
                inputData: {
                    tracks: trackBatch,
                    artist: inputData.artist
                }
            })
        );

    }

    await session.close()

    return {
        artist: id,
        status: 'Imported',
        tracks: inputData.tracks.length,
        collabs: inputData.collabs.length,
    }
}

async function _getImportData(id) {

    const config = {
        collabsOnly: true,
        groupCollabs: true
    }

    const token = await spotify.getToken()

    const artist = await spotify.getArtist({
        id: id,
        authToken: token
    })

    const artistAlbums = await spotify.getArtistAlbums({
        artist: artist,
        authToken: token
    })

    const tracks = []

    const collabs = []

    for (const album of artistAlbums) {
        const albumTracks = []
        let isCompilationAlbum = false;

        if (album.artists.some(_artist => _artist.id == spotify.genericID)) {
            isCompilationAlbum = true

            if (album.name.toLowerCase().indexOf(' cover') > -1) {
                continue
            }
        }


        album.tracks.forEach(trackItem => {

            if (config.collabsOnly) {

                if (isCompilationAlbum) {
                    const durationMinutes = trackItem.durationMS / 60000
                    if (durationMinutes > 15) {
                        console.log(durationMinutes)
                        console.log(trackItem.id)
                        console.log(trackItem.name)
                        console.log('musica longa  em um album de compilação, possívelmente uma musica compilada com vários artistas')
                        return
                    }

                    if (trackItem.artists.some(_artist => _artist.id == spotify.genericID)) {
                        console.log('"various artists" em uma música em um album compilado, possivelmente uma musica compilada com varios artistas')
                        return
                    }

                }

                if (trackItem.artists.length == 1)
                    return;


                //TODO: melhorar isso
                if (config.groupCollabs) {
                    let validTrack = false

                    trackItem.artists.forEach((artistItem, index) => {
                        if (artistItem.id == artist.id)
                            return

                        if (collabs.indexOf(artistItem.id) == -1) {
                            // console.log('esse artista é novo!')
                            // console.log('id: ' + artist.id)
                            collabs.push(artistItem.id)
                            validTrack = true
                        }
                    })

                    if (!validTrack) {
                        return
                    }
                }
            }

            trackItem.albumId = album.id
            trackItem.compilation = isCompilationAlbum

            albumTracks.push(trackItem)
        })

        tracks.push(...albumTracks)
    }

    return {
        artist: artist,
        tracks: tracks,
        collabs: collabs
    }
}

module.exports = {
    getArtist: getArtist,
    listArtists: listArtists,
    searchArtists: searchArtists,
    importArtist: importArtist
}