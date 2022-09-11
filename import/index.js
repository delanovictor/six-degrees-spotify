
(async () => {

    const { getImportData } = require('./helper');
    const database = require('../services/db');
    const path = require('path')
    const _ = require('lodash/array')
    const fs = require('fs/promises')

    require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

    const importQueue = ['3Bnq7jiU506HcPjRgQ43TM']
    const importedList = []
    const addedList = []

    try {

        while (importQueue.length > 0) {
            console.log(`Queue Size ${importQueue.length}`)

            const id = importQueue.shift()

            if (id) {
                const newIds = await importArtist(id)

                //Save as imported
                importedList.push(id)

                //Save to be imported, if it isn't already in queue
                const toImport = newIds.filter((_id) => {
                    return importQueue.indexOf(_id) == -1 && importedList.indexOf(_id) == -1
                })
                importQueue.push(...toImport)


                //Save as added to db, but not imported
                const possibleAdded = [...newIds, id]

                const added = possibleAdded.filter((_id) => {
                    return addedList.indexOf(_id) == -1
                })

                addedList.push(...added)


                console.log(`Added to queue ${toImport.length} items`)
                console.log(``)
            }
        }

    } catch (error) {

        console.error(`Something went wrong: ${error}`);

    } finally {
        await fs.writeFile('./log.json', JSON.stringify({
            importQueue: importQueue,
            importedList: importedList,
            addedList: addedList
        }))
    }

    await fs.writeFile('./log.json', JSON.stringify({
        importQueue: importQueue,
        importedList: importedList,
        addedList: addedList
    }))

    async function importArtist(id) {
        const session = database.getConnection()

        console.log(`Get Artist  ${id}`)

        console.time(`Import Data: `);
        const inputData = await getImportData(id)
        console.timeEnd(`Import Data: `);

        if (!inputData)
            return []

        console.log(`Insert Artist ${inputData.artist.name}`)

        const createArtistQuery = `// 1 -
                        UNWIND $inputData AS value

                        // ======== CREATE ARTIST ==========
                        MERGE (a1:Artist {
                            id: value.id
                        })
                        SET a1.name = value.name, a1.image = value.image, 
                            a1.link = value.link
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

        return inputData.collabs
    }

})();