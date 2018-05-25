import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'
import Peer from 'simple-peer'

const socket = io()

class App extends Component {
  state = {
    sender:    false,
    connected: false,
    message:   'Lorem ipsum.'
  }

  componentDidMount = () => {
    socket.on('peer-connect', () => {
      this.peer = new Peer()
      this.setupPeerCallbacks()
    })

    socket.on('signal', data => {
      this.peer.signal(data)
    })
  }

  setupPeerCallbacks = () => {
    this.peer.on('signal', function (data) {
      // when we have our own ICE data, give it to the remote peer via the signaling server
      socket.emit('signal', data)
    })

    this.peer.on('connect', () => {
      this.setState({connected: true})
    })

    this.peer.on('data', data => {
      this.setState({message: data.toString()})
    })
  }

  connectAsSender = () => {
    socket.emit('peer-connect') // tell other peer to connect as a receiver
    this.setState({
      sender: true
    }, () => {
      this.peer = new Peer({initiator: true})
      this.setupPeerCallbacks()
    })
  }

  sendMessage = () => {
    this.peer.send(this.chatinput.value)
  }

  render () {
    return <div className="App">
      <header className="App-header">
        <h1 className="App-title">WebRTC Chat Demo</h1>
        <button onClick={this.connectAsSender}>
          {this.state.connected ? `Connected as ${this.state.sender ? 'sender' : 'receiver'}` : 'Connect'}
        </button>
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
