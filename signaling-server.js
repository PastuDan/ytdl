const http = require('http').createServer().listen(8080, '0.0.0.0')
const io = require('socket.io').listen(http)

io.on('connection', function (socket) {
  socket.on('signal', function (message) {
    socket.broadcast.emit('signal', message)
  })

  socket.on('peer-connect', function () {
    socket.broadcast.emit('peer-connect')
  })
})
