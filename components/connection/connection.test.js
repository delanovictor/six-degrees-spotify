const connection = require('./connection')

describe("Connection", () => {

    it("GetPathBetweenNodes - Should Return an Array of Nodes", async () => {
        const params = {
            start: '3fMbdgg4jU18AjLCKBhRSm',
            end: '6kACVPfCOnqzgfEF5ryl0x',
            maxLength: 6
        }

        const nodes = await connection.getPath(params)

        expect(nodes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: expect.any(String),
                    id: expect.any(String)
                })
            ])
        )
    })

})