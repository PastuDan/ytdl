// adapted heavily from https://github.com/googlecodelabs/webrtc-web/blob/master/step-06/js/main.js

/* WebRTC Connection Flow:
 * 1.
 */

import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'

const socket = io()

socket.on('connect', () => {
  console.log(socket.id) // 'G5p5...'
})

socket.on('connection', function () {
  console.log('socket - connected to signaling server')
})

function logError (err) {
  if (!err) return
  if (typeof err === 'string') {
    console.warn(err)
  } else {
    console.warn(err.toString(), err)
  }
}

const rtcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
}

let peerConnection
let dataChannel

class App extends Component {
  state = {
    sender:    false,
    connected: false,
    message: 'Lorem ipsum.'
  }

  componentDidMount = () => {
    socket.on('peer-connect', () => {
      this.createPeerConnection() // this connects as receiver
    })

    socket.on('message', (message) => {
      switch (message.type) {
        case 'offer':
          //TODO I dont think this is ever called????
          console.log('Signaling Message: Got offer. Sending answer to peer.')
          peerConnection.setRemoteDescription(new RTCSessionDescription(message), function () {}, logError)
          peerConnection.createAnswer(this.onLocalSessionCreated, logError)
          break
        case 'answer':
          console.log('Signaling Message: Got answer.')
          peerConnection.setRemoteDescription(new RTCSessionDescription(message), function () {}, logError)
          break
        case 'candidate':
          console.log('Signaling Message: Got candidate.')
          peerConnection.addIceCandidate(new RTCIceCandidate({candidate: message.candidate}))
          break
        default:
          // TODO break these into socket.on(event) blocks
          break
      }
    })
  }

  onLocalSessionCreated (desc) {
    console.log('local session created:', desc)
    peerConnection.setLocalDescription(desc, function () {
      console.log('sending local desc:', peerConnection.localDescription)
      socket.emit('message', peerConnection.localDescription)
    }, logError)
  }

  createPeerConnection () {
    // This line only reaches out to the STUN server, which tells us about ourself (IP, firewall config, etc)
    peerConnection = new RTCPeerConnection(rtcConfig)

    // Once we get ICE candidate(s) from the STUN server, we can send it to the other peer, via the signaling server
    peerConnection.onicecandidate = function (event) {
      console.log('icecandidate event:', event)
      if (event.candidate) {
        socket.emit('message', {
          type:      'candidate',
          label:     event.candidate.sdpMLineIndex,
          id:        event.candidate.sdpMid,
          candidate: event.candidate.candidate
        })
      }
    }

    if (this.state.sender) {
      console.log('Creating Data Channel')
      dataChannel = peerConnection.createDataChannel('photos')
      this.onDataChannelCreated(dataChannel)
      console.log('Creating an offer')
      peerConnection.createOffer(this.onLocalSessionCreated, logError)
    } else {
      peerConnection.ondatachannel = (event) => {
        console.log('ondatachannel:', event.channel)
        dataChannel = event.channel
        this.onDataChannelCreated(dataChannel)
      }
    }
  }

  onDataChannelCreated = channel => {
    console.log('Data Channel Created:', channel)

    channel.onopen = () => {
      console.log('Data Channel Opened.')
      this.setState({
        connected: true
      })
    }

    channel.onclose = () => {
      console.log('Data Channel Closed.')
      this.setState({
        connected: false,
        message: 'Disconnected.'
      })
    }

    channel.onmessage = (event) => {
      this.setState({
        message: event.data
      })
    }
  }

  connectAsSender = () => {
    socket.emit('peer-connect') // tell other peers to connect as a receiver
    this.setState({
      sender: true
    }, () => {
      this.createPeerConnection()
    })
  }

  sendMessage = () => {
    dataChannel.send(this.chatinput.value)
  }

  render () {
    return <div className="App">
      <header className="App-header">
        <h1 className="App-title">WebRTC Chat Demo</h1>
        <button onClick={this.connectAsSender}>
          {this.state.connected ? `Connected as ${this.state.sender ? 'sender' : 'receiver'}` : 'Connect'}
        </button>
        {/*<button onClick={sendData}>Send</button>*/}
      </header>
      <p className="App-intro">
        {this.state.connected && this.state.sender ?
          <textarea onChange={this.sendMessage}
                    ref={node => this.chatinput = node}
                    cols="30"
                    rows="10"
                    placeholder={'Anything you type here will auto send...'}/> :
          this.state.message}
      </p>
    </div>
  }
}

export default App
