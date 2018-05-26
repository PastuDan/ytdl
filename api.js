const fs = require('fs')
const youtubedl = require('youtube-dl')
const io = require('socket.io-client')
const Peer = require('simple-peer')
const wrtc = require('wrtc')

const socket = io('ws://localhost:8080')

let peer
socket.on('peer-connect', () => {
  peer = new Peer({wrtc: wrtc})
  peer.on('signal', function (data) {
    // when we have our own ICE data, give it to the remote peer via the signaling server
    socket.emit('signal', data)
  })

  peer.on('connect', () => {
    console.log('peer connected')
  })

  peer.on('data', url => {
    console.log('data: ' + url)
    downloadVideo(url.toString())
  })
})

socket.on('signal', data => {
  peer.signal(data)
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
}
