// const fs = require('fs');
const youtubedl = require('youtube-dl');


const express = require('express')
const api = express()

api.get('/', (req, res) => {
  const videoUrl = req.query.url
  const video = youtubedl(videoUrl,
    // Optional arguments passed to youtube-dl.
    ['--format=best'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });

  // Will be called when the download starts.
  video.on('info', function(info) {
    console.log('Download started');
    console.log('filename: ' + info.filename);
    console.log('size: ' + info.size);
  });

  let size = 0;
  video.on('info', function(info) {
    size = info.size;
  });

  let pos = 0;
  video.on('data', function data(chunk) {
    pos += chunk.length;
    // `size` should not be 0 here.
    if (size) {
      const percent = (pos / size * 100).toFixed(2);
      console.log(`${percent}re%`);
    }
  });

  res.header('Content-Disposition', 'attachment; filename="video.mp4"');
  video.pipe(res);

  // res.pipe('');
})

const port = 3200;
api.listen(port, () => console.log(`Example app listening on port ${port}!`))

