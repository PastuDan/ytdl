const http = require('http');
const express = require('express')
const cors = require('cors')
const app = express()

const server = http.createServer(app);
const io = require('socket.io')(server)
const port = process.env.SIGNALING_SERVER_PORT || 80

app.use(cors())

io.on('connection', function (socket) {
  socket.on('signal', function (message) {
    socket.broadcast.emit('signal', message)
  })

  socket.on('peer-connect', function () {
    socket.broadcast.emit('peer-connect')
  })

  socket.on('download-success', function ({side}) {
    // Log server's failure / success (as reported via client AND server), & download / upload speed, in redis

    // If both sides report success, Increase client's penalty (via IP) in redis. Cap at 50 per month.
  })
})

app.listen(port, function () {
  console.log(`WebRTC signaling server listening on port ${port}`)
})