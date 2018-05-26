import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'
import Peer from 'simple-peer'
import ProgressCircle from './ProgressCircle'
import FileSaver from 'file-saver'

const wsUrl = process.env.NODE_ENV === 'production' ? 'http://live.milliamp.io' : ''
const socket = io(wsUrl)

let metadata
const parts = []

class App extends Component {
  state = {
    connected:        false,
    uiState:          'initial',
    downloadSize:     0,
    bytesDownloaded:  0,
    videoThumbnail:   null,
    videoTitle:       'Loading details...',
    videoDescription: ''
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
          videoThumbnail:   metadata.thumbnail,
          videoTitle:       metadata.title,
          videoDescription: metadata.description,
          downloadSize:     metadata.size,
        })
        console.log(metadata)

        // set up stream saver
        return
      }

      parts.push(data)
      console.log('chunk', this.state.bytesDownloaded / this.state.downloadSize + '%', this.state.bytesDownloaded, this.state.downloadSize,)
      this.setState({
        bytesDownloaded: this.state.bytesDownloaded + data.length
      })

      if (this.state.bytesDownloaded === this.state.downloadSize) {
        const blob = new Blob(parts, {type: 'application/octet-stream'})
        FileSaver.saveAs(blob, 'download.mp4')
      }
    })

  }

  parseInput = () => {
    let parsedUrl = null
    try {
      parsedUrl = new URL(this.searchInput.value)
      this.setState({uiState: 'progress'})
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
      </header>
      <section>
        <div className={`App-flip-container ${this.state.uiState}`}>
          <div className="flipper">
            <div className="front">
              <input className={this.state.uiState}
                     onChange={this.parseInput}
                     ref={node => this.searchInput = node}
                     placeholder={'Paste a URL or Search...'}/>
            </div>
            <div className="back">
              <ProgressCircle className="App-progress"
                              uiState={this.state.uiState}
                              percent={this.state.downloadSize ? 100 * this.state.bytesDownloaded / this.state.downloadSize : 0}
                              thumbnail={this.state.videoThumbnail}/>
              <div className="App-video-metadata">
                <h3>{this.state.videoTitle}</h3>
                <p className="App-video-metadata-description">{this.state.videoDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  }
}

export default App
