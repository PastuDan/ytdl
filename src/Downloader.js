import React, { Component } from 'react'
import './Downloader.css'
import PropTypes from 'prop-types'
import Peer from 'simple-peer'
import ProgressCircle from './ProgressCircle'
import FileSaver from 'file-saver'
import uuid from 'uuid'

const parts = []

class Downloader extends Component {
  static propTypes = {
    socket: PropTypes.object,
    downloadStarted: PropTypes.func,
  }

  state = {
    connected: false, // TODO remove or show indicator somewhere
    uiState: 'initial',
    size: 0,
    bytesDownloaded: 0,
    thumbnail: null,
    title: 'Loading details...',
    description: '',
    peerId: null
  }

  connectToPeer = () => {
    const socket = this.props.socket
    const downloadId = uuid.v4() // Used to distinguish between instances of downloader

    // tell another peer to connect as a receiver
    socket.emit('peer-connect', downloadId)
    const peer = new Peer({initiator: true})
    peer.on('signal', function (signal) {
      // when we have our own ICE data, give it to the remote peer via the signaling server
      socket.emit('signal', {downloadId, signal})
    })

    socket.on('signal', (data) => {
        // console.log('signal', data)
      if (data.downloadId !== downloadId) {
        console.log('no download id with signal', data)
        return
      }

      peer.signal(data.signal)
    })

    peer.on('connect', () => {
      console.log('connect')
      this.setState({connected: true})
      peer.send(this.searchInput.value)
    })

    peer.on('data', data => {
      if (this.state.size === 0) {
        const {thumbnail, title, description, size} = JSON.parse(data)
        this.setState({thumbnail, title, description, size})
        console.log(JSON.parse(data)) // TODO Remove
        return
      }

      parts.push(data)
      this.setState({
        bytesDownloaded: this.state.bytesDownloaded + data.length
      })

      if (this.state.bytesDownloaded === this.state.size) {
        const blob = new Blob(parts, {type: 'application/octet-stream'})
        FileSaver.saveAs(blob, `${this.state.title}.mp4`)
      }
    })

  }

  parseInput = () => {
    try {
      new URL(this.searchInput.value) // if this errors, the user input is probably a search term
    } catch (e) {
      // TODO user input is a search term, so query APIs and show videos / songs related to their search
      console.log('treating user input as a search term, not a URL')
      return
    }

    this.setState({uiState: 'progress'})
    this.connectToPeer()
    this.props.downloadStarted()
  }

  componentDidMount = () => {
    this.searchInput.focus()
  }

  render () {
    return <div className={`Downloader-flip-container ${this.state.uiState}`}>
      <div className="flipper">
        <div className="front">
          <input
            className={this.state.uiState}
            onChange={this.parseInput}
            ref={node => this.searchInput = node}
            placeholder={'Paste a URL or Search...'}/>
        </div>
        <div className="back">
          <ProgressCircle
            className={`Downloader-progress ${this.state.connected ? 'connected' : 'disconnected'}`}
            uiState={this.state.uiState}
            percent={this.state.size ? 100 * this.state.bytesDownloaded / this.state.size : 0}
            thumbnail={this.state.thumbnail}/>
          <div className="Download-video-metadata">
            <h3>{this.state.title}</h3>
            <p className="Downloader-video-metadata-description">{this.state.description}</p>
          </div>
        </div>
      </div>
    </div>
  }
}

export default Downloader
