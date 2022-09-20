const artists = require('./artists')

describe("Artists", () => {

    it("GetArtist - Should Return an Artist", async () => {
        const id = '4tZwfgrHOc3mvqYlEYSvVi'

        const artist = await artists.getArtist(id)

        expect(artist).toMatchObject({ name: 'Daft Punk' })
    })


    it("GetArtist - Should Return Null", async () => {
        const id = 'xxxxx'

        const artist = await artists.getArtist(id)

        expect(artist).toBeNull()
    })


    it("GetAllArtists - Should Return Array of Artists", async () => {

        const params = {
            limit: 5,
            offset: 3
        }

        const artistList = await artists.listArtists(params)

        expect(artistList).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: expect.any(String),
                    id: expect.any(String)
                })
            ])
        )
    })

})