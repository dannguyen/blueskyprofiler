# DEVNOTES

## API calls

### profile

https://docs.bsky.app/docs/api/app-bsky-actor-get-profile

get profile
https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=bsky.app

## graph

### get followers

https://public.api.bsky.app/xrpc/app.bsky.graph.getFollowers?actor=bsky.app&limit=10

### get follows

https://docs.bsky.app/docs/api/app-bsky-graph-get-follows

https://public.api.bsky.app/xrpc/app.bsky.graph.getFollows?actor=atproto.com&limit=50

## feeds

### author feed

https://docs.bsky.app/docs/api/app-bsky-feed-get-author-feed

100 posts from an author's feed
https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=bsky.app&limit=100

### get quotes

https://docs.bsky.app/docs/api/app-bsky-feed-get-quotes
https://public.api.bsky.app/xrpc/app.bsky.feed.getQuotes?limit=20&uri=at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3le6bze3nus2c
