
(async () => {
    try {

        const artistASelect = $('#artist-a-select')
        const artistBSelect = $('#artist-b-select')

        const artistASearch = $('#artist-a-search')
        const artistBSearch = $('#artist-b-search')

        artistASearch.on('input', await search)
        artistBSearch.on('input', await search)

        const findButton = $('#find')
        const resultContainer = $('#result')

        findButton.on('click', async (e) => {
            e.preventDefault()

            const artistA = artistASelect.find(":selected").val()
            const artistB = artistBSelect.find(":selected").val()

            console.log('http://localhost:3000/network?' + new URLSearchParams({
                start: artistA,
                end: artistB,
            }))

            const response = await fetch('http://localhost:3000/network?' + new URLSearchParams({
                start: artistA,
                end: artistB,
            }))

            const path = await response.json()

            let resultText = ""

            for (const i in path) {
                const index = parseInt(i)

                if (index % 2 == 0 && index < path.length - 1) {
                    resultText += `${path[index].name} tocou "${path[index + 1].name}" com ${path[index + 2].name} <br><br>`
                }
            }

            console.log(resultText)

            resultContainer.html(resultText)
        })


        async function search(e) {
            const target = $(e.currentTarget)
            const container = target.parent().find('.options-container')
            const value = target.val()

            if (value.length > 3) {
                const response = await fetch('http://localhost:3000/artists/search?' + new URLSearchParams({
                    str: value
                }))

                const list = await response.json()

                container.empty()

                list.forEach(item => {
                    container.append(`<option value="${item.id}"> ${item.name}</option>`)
                })
            }
        }

    } catch (err) {
        console.log(err)
    }
})();