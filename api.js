const fs = require('fs')
const youtubedl = require('youtube-dl')
const io = require('socket.io-client')
const Peer = require('simple-peer')
const wrtc = require('wrtc')

const socket = io('ws://localhost:8080')

socket.on('connect', function (data) {
  socket.emit('peer-type', 'app')
})

//TODO keep a list of peers so multiple videos can be downloaded at once
let peer
socket.on('peer-connect', downloadId => {
  peer = new Peer({wrtc})
  peer.on('signal', function (signal) {
    // when we have our own ICE data, give it to the remote peer via the signaling server
    socket.emit('signal', {downloadId, signal})
  })

  peer.on('connect', () => {
    console.log('peer connected')
  })

  peer.on('data', url => {
    console.log('data: ' + url)
    downloadVideo(url.toString())
  })
})

socket.on('signal', ({signal}) => {
  peer.signal(signal)
})

function downloadVideo (url) {
  const video = youtubedl(url,
    // Optional arguments passed to youtube-dl.
    ['-f', '313/137'],
    // Additional options can be given for calling `child_process.execFile()`.
    {cwd: __dirname})

  let size = 0
  // Called when the download starts.
  video.on('info', function (info) {
    console.log('Download started')
    console.log('filename: ' + info.filename)
    console.log('size: ' + info.size)

    size = info.size
    peer.send(new Buffer(JSON.stringify(info)))
  })

  let pos = 0
  video.on('data', function data (chunk) {
    pos += chunk.length
    // `size` should not be 0 here.
    if (size) {
      const percent = (pos / size * 100).toFixed(2)
      process.stdout.cursorTo(0)
      process.stdout.clearLine(1)
      process.stdout.write(percent + '%')
    }
  })

  video.pipe(peer)
  // video.pipe(fs.createWriteStream('myvideo.mp4'))

  //TODO handle error events from piping peer
}
