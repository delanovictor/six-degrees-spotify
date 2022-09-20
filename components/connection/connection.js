const database = require('../../services/db')
const neo4j = require('neo4j-driver')
const { importArtist } = require('../artists/artists')
const autoImport = true;

async function getPath(config) {
    const session = database.getConnection()
    const path = []

    if (autoImport) {
        await checkEnds(config.start, config.end)
    }


    const connectionQuery = `MATCH p = shortestPath((n:Artist)-[:PERFORMED*]-(m:Artist)) 
                      WHERE 
                           n.id = $start and 
                           m.id = $end
                           ${config.excludeArtists ? `and NONE(eA IN NODES(p) WHERE eA:Artist AND eA.id IN [$excludeArtists] )` : ''}
                           ${config.excludeTracks ? `and NONE(eT IN NODES(p) WHERE eT:Track AND eT.id IN [$excludeTracks] )` : ''}
                           ${config.includeArtists ? `and ANY(iA IN NODES(p) WHERE iA:Artist AND iA.id IN [$includeArtists] )` : ''}
                           ${config.includeTracks ? `and ANY(iT IN NODES(p) WHERE iT:Track AND iT.id IN [$includeTracks] )` : ''}
                           ${config.remix ? '' : `AND NONE(n in nodes(p) WHERE EXISTS(n.name) AND n.name =~ "(?i).*" + "remix" + ".*" AND 'Track' in LABELS(n)) `}
                      RETURN p`

    const connectionResult = await session.executeRead(tx =>
        tx.run(connectionQuery, {
            start: config.start,
            end: config.end,
            excludeArtists: formatArrayQueryParam(config.excludeArtists),
            excludeTracks: formatArrayQueryParam(config.excludeTracks),
            includeArtists: formatArrayQueryParam(config.includeArtists),
            includeTracks: formatArrayQueryParam(config.includeTracks),
        })
    );

    await session.close();

    if (connectionResult.records.length == 0)
        return null

    connectionResult.records.forEach(record => {
        const pathFound = record._fields[0]

        if (pathFound) {
            pathFound.segments.forEach((seg, index) => {
                const type = index % 2 == 0 ? 'artist' : 'track'

                let props = {
                    ...seg.start.properties,
                    type: type
                }

                path.push(props)

                if (index == pathFound.segments.length - 1) {
                    props = {
                        ...seg.end.properties,
                        type: 'artist'
                    }

                    path.push(props)
                }
            })
        }
    })

    return path
}

async function checkEnds(start, end) {
    const session = database.getConnection()

    const existsQuery = `
                        MATCH (a:Artist)
                        WHERE a.id = $start or a.id = $end
                        RETURN a
                    `

    const existsResult = await session.executeRead(tx =>
        tx.run(existsQuery, { start: start, end: end })
    );

    if (existsResult.records.length < 2) {
        const artistsToImport = []

        if (existsResult.records.length == 1) {
            const foundArtist = existsResult.records[0]._fields[0]

            if (foundArtist.properties.id == start) {
                artistsToImport.push(end)
            } else {
                artistsToImport.push(start)
            }
        } else {
            artistsToImport.push(start, end)
        }

        for (const artistId of artistsToImport) {
            const importInfo = await importArtist(artistId)
        }
    }

    await session.close();

}

function formatArrayQueryParam(array) {
    if (array)
        return array
}
module.exports = {
    getPath: getPath
}