# Six Degrees - Spotify

An API that uses data collected from the [Spotify API](https://developer.spotify.com/discover/) to find a connection between two artists. <br> The Project is inspired by the [Small-world Experiment](https://en.wikipedia.org/wiki/Small-world_experiment) aka Six degrees of separation.

---

## How it works

Two artists are directly connected if both of them collaborated on the same song. However, most of the time this isn't the case, so the quest becomes to find a third artist that collaborated with the first two in separated occasions. <br>If such artist does not exist, this process is repeated, adding connections until a path between the two first artists is found, or it is verified that there is no connection between them. A max number of connection can also be specified. <br>
This search is made possible by using the Spotify Web API data from artists and tracks and importing them to a graph database (Neo4J). 

---
## Examples

### 1. **Michael Jackson** and **Johnny Cash**
<br>

- **Michael Jackson** played [**Say Say Say**](https://open.spotify.com/track/1db0gbTSKdRQum8VlbNkiO) with **Paul McCartney**

- **Paul McCartney** played [**New Moon Over Jamaica**](https://open.spotify.com/track/3R2xNYnwseHB77A9CIHata) with **Johnny Cash**

<br>

There is a second degree connection between **Michael Jackson** and **Johnny Cash**.

<br>

### 2.  **Lady Gaga** and **The Strokes**
<br>

- **Lady Gaga** played [**Jewels N' Drugs**](https://open.spotify.com/track/2MqhCzdw8Py25ZHY2Di3Sr) with **T.I.**

- **T.I.** played [**How I Feel (feat. Eric Bellinger & Killer Mike)**](https://open.spotify.com/track/568Q0Y1ejIOU51W9ybefZs) with **Killer Mike**

- **Killer Mike** played [**pulling the pin (feat. Mavis Staples & Josh Homme)**](https://open.spotify.com/track/5COfxqk7FwuBgfC9270uG4) with **Josh Homme**

- **Josh Homme** played [**Mercy Mercy Me**](https://open.spotify.com/track/7BCQ4QUzY9F4wChjy1D40p) with **The Strokes**

<br>

There is a fourth degree connection between **Lady Gaga** and **The Strokes**.

<br>

### 3. **Iron Maiden** and **BTS**
<br>

Sadly, there is no connection between **Iron Maiden** and **BTS**.

<br>

---


## Request
| Name | Method | Description |
| --- | --- | --- |
|/connection | GET | Searches for a connection between two artists. <br> If there is a path connecting both, returns an array of the nodes that make out the path. The nodes in the array always alternate between artists and tracks.

## Search Parameters
| Name | Type | Required / Optional | Description |
| --- | --- | --- | --- |
| start | string | required | Spotify ID of the first artist in the network. |
| end | string | required | Spotify ID of the last artist in the network. |
| exclude_artist | string | optional | List of artists ID's to exclude from network search. Comma Separated. |
| exclude_track| string | optional | List of tracks ID's to exclude from network search. Comma Separated. |
| include_artist | string | optional | List of artists ID's to include in the network search. Comma Separated. |
| include_track| string | optional | List of tracks ID's to include in the network search. Comma Separated. |
| limit | number | optional | Max number of nodes between start and end. |

## Return 


`/connection/?start=3fMbdgg4jU18AjLCKBhRSm&end=6kACVPfCOnqzgfEF5ryl0x`

```json
[
    {
        "image": "https://i.scdn.co/image/ab6761610000e5eba2a0b9e3448c1e702de9dc90",
        "followers": 23980363,
        "name": "Michael Jackson",
        "link": "https://open.spotify.com/artist/3fMbdgg4jU18AjLCKBhRSm",
        "id": "3fMbdgg4jU18AjLCKBhRSm",
        "type": "artist"
    },
    {
        "image": "https://i.scdn.co/image/ab67616d0000b27392ed057542e2c0d3b9647c07",
        "link": "https://open.spotify.com/track/1db0gbTSKdRQum8VlbNkiO",
        "name": "Say Say Say - Remastered 2015",
        "albumId": "6zlKkX99NhLW8IRy77bYmb",
        "id": "1db0gbTSKdRQum8VlbNkiO",
        "type": "track"
    },
    {
        "image": "https://i.scdn.co/image/ab6761610000e5eb03bf2fe26e397122faa3d323",
        "followers": 4110946,
        "name": "Paul McCartney",
        "link": "https://open.spotify.com/artist/4STHEaNw4mPZ2tzheohgXB",
        "id": "4STHEaNw4mPZ2tzheohgXB",
        "type": "artist"
    },
    {
        "image": "https://i.scdn.co/image/ab67616d0000b273ade431b5fdd43d4617eccdcf",
        "name": "New Moon Over Jamaica",
        "link": "https://open.spotify.com/track/3R2xNYnwseHB77A9CIHata",
        "albumId": "2ey9jImi467qEu67fvW1kP",
        "id": "3R2xNYnwseHB77A9CIHata",
        "type": "track"
    },
    {
        "image": "https://i.scdn.co/image/ab6761610000e5eb152cf48cf9541c7061570857",
        "followers": 5468648,
        "name": "Johnny Cash",
        "link": "https://open.spotify.com/artist/6kACVPfCOnqzgfEF5ryl0x",
        "id": "6kACVPfCOnqzgfEF5ryl0x",
        "type": "artist"
    }
]
