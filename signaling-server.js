const port = process.env.SIGNALING_SERVER_PORT || 80
const http = require('http').createServer().listen(port)
const io = require('socket.io').listen(http)

const webPeers = {}
const appPeers = {}
const authedPeers = {}
const downloads = {}

io.on('connection', function (socket) {
  socket.on('signal', function ({downloadId, signal}) {
    if (!downloadId) {
      return
    }

    const peerPair = downloads[downloadId]
    if (!peerPair) {
      return
    }

    // Send the signal to the other side
    const side = appPeers.hasOwnProperty(socket.id) ? 'web' : 'app'
    peerPair[side].emit('signal', {downloadId, signal})
  })

  socket.on('peer-connect', function (downloadId) {
    // TODO grab a non-busy peer
    const peerIds = Object.keys(appPeers)
    const randomAppPeer = appPeers[peerIds[peerIds.length * Math.random() << 0]]

    if (!randomAppPeer) {
      return
    }

    randomAppPeer.emit('peer-connect', downloadId)
    downloads[downloadId] = {
      web: socket,
      app: randomAppPeer
    }
  })

  socket.on('download-success', function ({side}) {
    // Log server's failure / success (as reported via client AND server), & download / upload speed, in redis
    // If both sides report success, Increase client's penalty (via IP) in redis. Cap at 50 per month.
  })

  socket.on('peer-type', function (data) {
    switch (data) {
      case 'web':
        webPeers[socket.id] = socket
        break
      case 'app':
        appPeers[socket.id] = socket
        break
      default:
        socket.disconnect()
    }

    broadcastStats()
  })

  socket.on('auth', function (auth) {
    if (auth !== process.env.REACT_APP_YTDL_AUTH) {
      return
    }

    authedPeers[socket.id] = socket
    broadcastStats()
  })

  socket.on('disconnect', function () {
    delete webPeers[socket.id]
    delete appPeers[socket.id]
    delete authedPeers[socket.id]

    broadcastStats()
  })
})

function broadcastStats () {
  const app = Object.keys(appPeers).length
  const web = Object.keys(webPeers).length
  Object.entries(authedPeers).forEach(([id, peer]) => {
    peer.emit('stats', {web, app})
  })
}