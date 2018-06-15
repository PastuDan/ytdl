const port = process.env.SIGNALING_SERVER_PORT || 80
const http = require('http').createServer().listen(port)
const io = require('socket.io').listen(http)

const webPeers = {}
const appPeers = {}
const authedPeers = {}

io.on('connection', function (socket) {
  socket.on('signal', function (message) {
    // TODO find the peer with matching downloadId
    socket.broadcast.emit('signal', message)
  })

  socket.on('peer-connect', function (urlHash) {
    // TODO grab a non-busy peer, keep a list of peer pairs keyed off downloadId
    socket.broadcast.emit('peer-connect')
  })

  socket.on('download-success', function ({side}) {
    // Log server's failure / success (as reported via client AND server), & download / upload speed, in redis
    // If both sides report success, Increase client's penalty (via IP) in redis. Cap at 50 per month.
  })

  socket.on('peer-type', function (data) {
    switch (data) {
      case 'web':
        console.log('web', socket.id)
        webPeers[socket.id] = socket
        break
      case 'app':
        console.log('app', socket.id)
        appPeers[socket.id] = socket
        break
      default:
        socket.disconnect()
    }

    const app = Object.keys(appPeers).length
    const web = Object.keys(webPeers).length
    const authed = Object.keys(authedPeers).length
    Object.entries(authedPeers).forEach(([id, peer]) => {
      peer.send({web, app, authed})
    })
  })

  socket.on('auth', function (auth) {
    if (auth === process.env.REACT_APP_YTDL_AUTH) {
      authedPeers[socket.id] = socket
    }
  })

  socket.on('disconnect', function (reason) {
    delete webPeers[socket.id]
    delete appPeers[socket.id]
    delete authedPeers[socket.id]

    console.log(reason)
  })
})
