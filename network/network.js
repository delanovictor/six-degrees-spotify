const database = require('../services/db')
const neo4j = require('neo4j-driver')

async function getPath({ start, end, maxLength }) {
    const session = database.getConnection()
    const path = []

    const query = `MATCH p = shortestPath((:Person{id:$start})-[:PERFORMED*]-(:Person{id:$end}))
                   RETURN  p`

    const readResult = await session.executeRead(tx =>
        tx.run(query, { start: start, end: end })
    );

    await session.close();

    if (readResult.records.length == 0)
        return null

    readResult.records.forEach(record => {
        const pathFound = record._fields[0]

        if (pathFound) {
            pathFound.segments.forEach((seg, index) => {
                path.push(seg.start.properties)

                if (index == pathFound.segments.length - 1)
                    path.push(seg.end.properties)

            })
        }
    })

    return path
}

module.exports = {
    getPath: getPath
}