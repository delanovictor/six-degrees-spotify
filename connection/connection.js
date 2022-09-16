const database = require('../services/db')
const neo4j = require('neo4j-driver')

async function getPath({ start, end, maxLength, remix = false }) {
    const session = database.getConnection()
    const path = []

    const query = `MATCH p= shortestPath((n:Artist)-[:PERFORMED*]-(m:Artist)) 
                  WHERE 
                       n.id = $start and 
                       m.id = $end
                       //and NONE(x IN NODES(p) WHERE x:Artist AND x.name IN ["Luísa Sonza"] )
                       //and NONE(y IN NODES(p) WHERE y:Track AND y.id IN ["77xqyOo9JhgDkndyLVWxgK"] )
                       ${remix ? '' : `AND NONE(n in nodes(p) WHERE EXISTS(n.name) AND n.name =~ "(?i).*" + "remix" + ".*" AND 'Track' in LABELS(n)) `}
                  RETURN p`

    const readResult = await session.executeRead(tx =>
        tx.run(query, { start: start, end: end })
    );
    console.log(readResult)
    await session.close();

    if (readResult.records.length == 0)
        return null

    readResult.records.forEach(record => {
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

module.exports = {
    getPath: getPath
}