import React from 'react'
import PropTypes from 'prop-types'
import './ProgressCircle.css'

const r = 90
const c = Math.PI * r * 2

export default function ProgressCircle ({percent, thumbnail, uiState}) {
  console.log(percent)
  if (percent < 0) { percent = 0}
  if (percent > 100) { percent = 100}

  const strokeDashoffset = (100 - percent) / 100 * c

  return <div className={`ProgressCircle-container ${uiState}`}>
    <div className="ProgressCircle-percent" style={{backgroundImage: `url(${thumbnail})`}}>
      {percent.toFixed(1)}%
    </div>
    <svg width="200" height="200" viewport="0 0 100 100">
      <circle className="ProgressCircle-circle" r={r} cx="100" cy="100" fill="transparent" strokeDasharray={c}
              strokeDashoffset="0"/>
      <circle className="ProgressCircle-circle ProgressCircle-indicator" r={r} cx="100" cy="100" fill="transparent"
              strokeDasharray={c}
              strokeDashoffset="0" style={{strokeDashoffset}}/>
    </svg>
  </div>
}

ProgressCircle.propTypes = {
  percent:   PropTypes.number,
  thumbnail: PropTypes.string,
  uiState:   PropTypes.string,
}
