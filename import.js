(async () => {
    const database = require('./services/db');
    const axios = require('axios');
    const dotenv = require('dotenv').config();

    try {
        const importQueue = ['0epOFNiUfyON9EYx7Tpr6V']

        while (importQueue.length > 0) {
            console.log(`Queue Size ${importQueue.length}`)

            const id = importQueue.shift()

            if (id) {
                const newIds = await importArtist(id)

                importQueue.push(...newIds)

                console.log(`Added to queue ${newIds.length} items`)
                console.log(``)
            }
        }



    } catch (error) {

        console.error(`Something went wrong: ${error}`);

    }


    async function importArtist(id) {
        const session = database.getConnection()

        console.log(`Get Artist  ${id}`)

        const responseArtist = await axios({
            method: 'GET',
            url: `http://localhost:8000/tracks`,
            params: {
                collabs_only: true,
                group_collabs: true,
                artist_id: id
            }
        })


        const inputData = responseArtist.data

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
            tx.run(createTracksQuery, { inputData: inputData })
        );

        await session.close()

        return inputData.collabs
    }

})();
