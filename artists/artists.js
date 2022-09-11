const database = require('../services/db')
const neo4j = require('neo4j-driver')


async function searchArtists(searchString) {
    const session = database.getConnection()
    const result = []

    const query = `MATCH(n: Artist)
                   WHERE n.name =~ "(?i).*" + $search + ".*"
                   RETURN n`

    const readResult = await session.executeRead(tx =>
        tx.run(query, { search: searchString })
    );

    await session.close();
    console.log('search')
    console.log(readResult.summary.query)
    // console.log(readResult.summary.counters)


    readResult.records.forEach(record => {
        if (record && record._fields) {
            result.push(record._fields[0].properties)
        }
    })

    console.log(result)

    return result
}

async function getArtist({ id, name }) {
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

module.exports = {
    getArtist: getArtist,
    listArtists: listArtists,
    searchArtists: searchArtists
}