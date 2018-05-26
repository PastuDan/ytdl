import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import ProgressCircle from './ProgressCircle'
import { createWriteStream, supported, version } from 'streamsaver'

const socket = io()
let metadata

class App extends Component {
  state = {
    connected:       false,
    thumbnail:       null,
    uiState:         'initial',
    downloadSize:    0,
    bytesDownloaded: 0,
  }

  componentDidMount = () => {
    socket.on('signal', data => {
      this.peer.signal(data)
    })
  }

  connectToPeer = () => {
    // tell other peer to connect as a receiver
    // TODO have server grab a non-busy peer
    socket.emit('peer-connect')
    this.peer = new Peer({initiator: true})
    this.peer.on('signal', function (data) {
      // when we have our own ICE data, give it to the remote peer via the signaling server
      socket.emit('signal', data)
    })

    this.peer.on('connect', () => {
      this.setState({connected: true})
      this.peer.send(this.searchInput.value)
    })

    this.peer.on('data', data => {
      if (!metadata) {
        metadata = JSON.parse(data)
        this.setState({
          thumbnail:    metadata.thumbnail,
          downloadSize: metadata.size,
        })
        console.log(metadata)

        // set up stream saver
        this.writer = createWriteStream('download.mp4', metadata.size).getWriter();
        return
      }

      this.writer.write(data)
      console.log('chunk', this.state.bytesDownloaded / this.state.downloadSize + '%', this.state.bytesDownloaded, this.state.downloadSize,)
      this.setState({
        bytesDownloaded: this.state.bytesDownloaded + data.length
      })

      if (this.state.bytesDownloaded === this.state.downloadSize) {
        this.writer.close();
      }
    })

  }

  parseInput = () => {
    let parsedUrl = null
    try {
      parsedUrl = new URL(this.searchInput.value)
      this.setState({uiState: 'transitioning'}, () => {
        setTimeout(() => {
          this.setState({uiState: 'progress'})
        }, 300)
      })
      this.connectToPeer()
    } catch (e) {
      // TODO user input is a search term, so query APIs and show videos / songs related to their search
      console.log('treating user input as a search term, not a URL')
    }
  }

  render () {

    return <div className="App">
      <header className="App-header">
        <h1 className="App-title">Video Saver</h1>
        <h2>{this.state.connected ? 'Connected to electron / node peer' : 'Not Connected'}</h2>
        <ProgressCircle uiState={this.state.uiState}
                        percent={this.state.downloadSize ? 100 * this.state.bytesDownloaded / this.state.downloadSize : 0}
                        thumbnail={this.state.thumbnail}/>
      </header>
      <p className="App-intro">
        <input className={this.state.uiState}
               onChange={this.parseInput}
               ref={node => this.searchInput = node}
               placeholder={'Paste a URL or Search...'}/>
      </p>
    </div>
  }
}

export default App
