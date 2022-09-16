const connection = require('./connection')

describe("Connection", () => {

    it("GetPathBetweenNodes - Should Return an Array of Nodes", async () => {
        const params = {
            start: '1R84VlXnFFULOsWWV8IrCQ',
            end: '7BaNoX8qvNOlPnt68UoUie',
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


    it("GetPathBetweenNodes - Should Return Null", async () => {
        const params = {
            start: '1R84VlXnFFULOsWWV8IrCQ',
            end: 'xxxxx',
            maxLength: 1
        }

        const nodes = await connection.getPath(params)

        expect(nodes).toBeNull()
    })

})