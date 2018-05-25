const http = require('http').createServer().listen(8080, '0.0.0.0')
const io = require('socket.io').listen(http)

io.on('connection', function (socket) {
  console.log(`Client Connected: ${socket.id}`)

  socket.on('message', function (message) {
    console.log(`got message:`, message.type)
    // broadcast sends to all connected clients except the one who sent this message
    socket.broadcast.emit('message', message)
  })

  socket.on('peer-connect', function () {
    console.log('peer-connect')
    socket.broadcast.emit('peer-connect')
  })
})
