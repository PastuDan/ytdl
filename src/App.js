import React, { Component } from 'react'
import './App.css'
import io from 'socket.io-client'
import Downloader from './Downloader'
import { getLocalStorage } from './local-storage'
import logo from './logo.png'

const wsUrl = process.env.NODE_ENV === 'production' ? process.env.REACT_APP_SOCKET_URL : ''
const socket = io(wsUrl)
const remaining = getLocalStorage('remaining', 10)

socket.on('connect', function () {
  socket.emit('peer-type', 'web')
})

class App extends Component {
  state = {
    downloaderCount: 1,
    remaining,
    stats: null
  }

  downloadStarted = () => {
    this.setState({downloaderCount: this.state.downloaderCount + 1})
  }

  componentDidMount = () => {
    socket.on('remaining', (ipRemaining) => {
      if (remaining < ipRemaining) {
        // bail early if client soft limit is lower
        return
      }

      this.setState({remaining})
    })

    if (process.env.REACT_APP_YTDL_AUTH) {
      socket.emit('auth', process.env.REACT_APP_YTDL_AUTH)
      socket.on('stats', stats => {
        this.setState(stats)
      })
    }
  }

  render () {
    let downloaders = []
    for (let i = 0; i < this.state.downloaderCount; i++) {
      downloaders.push(<Downloader
        key={i}
        socket={socket}
        downloadStarted={this.downloadStarted}/>)
    }

    return <div className="App">
      <header className="App-header">
        <div className="App-header-flex">
          <img className="App-header-component App-logo" src={logo} alt="VideoSaver"/>
          <div className="App-header-component App-options">
            🎥 &middot; 1080p &middot; mp4 &nbsp; ⚙
          </div>
        </div>
        {this.state.stats ? <div>
          App: {this.state.stats.app} |
          Web: {this.state.stats.web} |
          Ratio: {this.state.stats.app / (this.state.stats.app + this.state.stats.web)}
        </div> : null}
      </header>
      <section>
        {downloaders}
      </section>
    </div>
  }
}

export default App
