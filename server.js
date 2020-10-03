const child_process = require('child_process')
const express = require('express')
const fs = require('fs')

const { config } = require('./config')
const { ssdp } = require('./ssdp')

const app = express()

app.set('view engine', 'ejs')

const scanFile = `${__dirname}/scan_WinterHill.txt`

const channelMap = {}
const scanData = fs.readFileSync(scanFile).toString().split('\n')
let channelCurrent = null
scanData.forEach(line => {
  if (channel = line.match(/\[(.*)\]/)) {
    channelCurrent = {
      GuideName: channel[1],
    }
  }
  if (channelCurrent && (serviceId = line.match(/SERVICE_ID = (\d+)$/))) {
    channelCurrent.GuideNumber = serviceId[1]
    channelCurrent.URL = `${config.BaseURL}/stream/${serviceId[1]}`,
    channelMap[serviceId[1]] = channelCurrent
  }
})

app.get('/device.xml', (req, res) => {
  res
    .set('Content-Type', 'text/xml')
    .render('device', { config })
})

app.get('/ConnectionManager.xml', (_, res) => {
  res.sendFile(`${__dirname}/ConnectionManager.xml`)
})

app.get('/ContentDirectory.xml', (_, res) => {
  res.sendFile(`${__dirname}/ContentDirectory.xml`)
})

app.get('/discover.json', (_, res) => {
  res.json(config)
})

app.get('/lineup_status.json', (_, res) => {
  res.json({
    ScanInProgress: 0,
    ScanPossible: 1,
    Source: 'Cable',
    SourceList: ['Cable'],
  })
})

app.get('/lineup.json', (_, res) => {
  res.json(Object.values(channelMap))
})

app.get('/stream/:streamId', (req, res) => {
  let channel = channelMap[req.params.streamId]
  if (!channel) {
    res.status(404).end()
    return
  }
  console.log(`Starting stream of channel ${channel.GuideName}`)
  const cmd = `dvbv5-zap -a 0 -c ${scanFile} -o - -P "${channel.GuideName}"`
  console.log(cmd)
  console.log([
    '-a 0',
    `-c ${scanFile}`,
    '-o -',
    '-P',
    `"${channel.GuideName}"`, 
  ].join(' '))
  const process = child_process.spawn('dvbv5-zap', [
    '-a 0',
    `-c ${scanFile}`,
    '-o -',
    '-P',
    `"${channel.GuideName}"`, 
  ], { shell: true })

  process.on('error', (err) => {
    console.log('Stream error', err)
    res.end()
  })

  process.on('close', () => {
    console.log('Stream closed')
    res.send()
  })

  req.on('close', () => {
    console.log('Request closed')
    process.kill('SIGHUP')
  })

  process.stdout.pipe(res)
})

app.listen(3000, () => {
  ssdp()
})