# YTDL / VideoSaver
An free and ad-free web-based P2P YouTube downloader. https://videosaver.app

## Concept / Business model
Youtube videos currently have to be downloaded with a desktop app because they require merging video and audo together in one file. So my idea is to have a swarm of peers: some electron users but mostly web users. The web users download 5 or so free videos per month before being asked to download the free electron app or pay (something like $5/mo). If they download the electron app, they become the users that serve videos to other people.

When a web user comes to the site and wants a video, we an orchestration server to say "sure, here's an electron user you can talk directly to"

And voila, p2p download begins.

## Legality
There are plenty of companies who operate a similar paid service, even located within the US. Still, it would be worth more thoroughly researching copyright law before accepting payments.

# Development
You'll need to start 3 processes to see a successful download. In this case, api.js acts as an electron peer since we don't any electron code yet.

`yarn start`

`nodemon api.js`

`nodemon signaling-server.js`

To test a download, try pasting https://www.youtube.com/watch?v=nr5Pj6GQL2o into the URL box.

# Example flow
```
+----------+                      +----------------+            +-------------+
|Web Client|                      |Signaling Server|            |Electron Peer|
+----+-----+                      +--------+-------+            +------+------+
     |                                     |                           |
     |                                     |   I'm online, as 1.2.3.4  |
     |                                     <---------------------------+
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |                                     |                           |
     |   Would like to download a video    |                           |
     +------------------------------------^>                           |
     |                                     |                           |
     |       Ok, talk to 1.2.3.4           |                           |
     <-------------------------------------+                           |
     |                                     |                           |
     |                                     |                           |
     |                                     +                           |
     |                                                                 |
     |          I'd like to download http://youtu.be/abc123            |
     +----------------------------------------------------------------->
     |                                                                 |
     |                 Send Video Metadata                             |
     <-----------------------------------------------------------------+
     |                                                                 |
     |                    Send Video File                              |
     <-----------------------------------------------------------------+
     |                                                                 |
     |                                                                 |
     +                                                                 +


```
