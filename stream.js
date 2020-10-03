const child_process = require('child_process')
const express = require('express')
const xml = require('xml')
const fs = require('fs')

const app = express()

const scanFile = `${__dirname}/scan_WinterHill.txt`

const config = {
  FriendlyName: 'HDHomerun (RPI)',
  Manufacturer: 'Silicondust',
  ManufacturerURL: 'https://github.com/nickbabenko/tvstream',
  ModelNumber: 'HDTC-2US',
  FirmwareName: 'hdhomeruntc_atsc',
  TunerCount: 1,
  FirmwareVersion: '20170930',
  DeviceID: '2f70c0d7-90a3-4429-8275-cbeeee9cd605',
  DeviceAuth: "test1234",
  BaseURL: 'http://192.168.0.71:3000',
  LineupURL: `http://192.168.0.71:3000/lineup.json`
}
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
    .send(xml([{
      root: [
        {
          _attr: {
            xmlns: 'urn:schemas-upnp-org:device-1-0',
            'xmlns:dlna': 'urn:schemas-dlna-org:device-1-0',
            'xmlns:pnpx': 'http://schemas.microsoft.com/windows/pnpx/2005/11',
            'xmlns:df': 'http://schemas.microsoft.com/windows/2008/09/devicefoundation',
          },
        },
        {
          specVersion: {
            major: 1,
            minor: 0,
          },
        },
        {
          URLBase: config.BaseURL,
        },
        {
          device: [
            { 'dlna:X_DLNADOC': 'DMS-1.50' },
            { 'pnpx:X_hardwareId': 'VEN_0115&amp;DEV_1040&amp;SUBSYS_0001&amp;REV_0004 VEN_0115&amp;DEV_1040&amp;SUBSYS_0001 VEN_0115&amp;DEV_1040' },
            { 'pnpx:X_deviceCategory': 'MediaDevices' },
            { 'df:X_deviceCategory': 'Multimedia' },
            { deviceType: 'urn:schemas-upnp-org:device:MediaServer:1' },
            { friendlyName: config.FriendlyName },
            { presentationURL: '/' },
            { manufacturer: config.Manufacturer },
            { manufacturerURL: config.ManufacturerURL },
            { modelDescription: config.FriendlyName },
            { modelName: config.FriendlyName },
            { modelNumber: config.ModelNumber },
            { modelURL: config.ManufacturerURL },
            { serialNumber: '' },
            { UDN: config.DeviceID },
          ],
        },
        {
          serviceList: [
            {
              service: [
                { serviceType: 'urn:schemas-upnp-org:service:ConnectionManager:1' },
                { serviceId: 'urn:upnp-org:serviceId:ConnectionManager' },
                { SCPDURL: '/ConnectionManager.xml' },
                { controlURL: `${config.BaseURL}/ConnectionManager.xml` },
                { eventSubURL: `${config.BaseURL}/ConnectionManager.xml` },
              ],
            },
            {
              service: [
                { serviceType: 'urn:schemas-upnp-org:service:ContentDirectory:1' },
                { serviceId: 'urn:upnp-org:serviceId:ContentDirectory' },
                { SCPDURL: '/ContentDirectory.xml' },
                { controlURL: `${config.BaseURL}/ContentDirectory.xml` },
                { eventSubURL: `${config.BaseURL}/ContentDirectory.xml` },
              ],
            },
          ],
        },
        {
          iconList: [
            {
              icon: [
                { mimetype: 'image/png' },
                { width: 48 },
                { height: 48 },
                { depth: 24 },
                { url: '/images/apple-touch-icon-57x57.png' },
              ],
            },
            {
              icon: [
                { mimetype: 'image/png' },
                { width: 120 },
                { height: 120 },
                { depth: 24 },
                { url: '/images/apple-touch-icon-120x120.png' },
              ],
            },
          ],
        },
      ],
    }]))
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
    console.log(err)
    res.end()
  })

  process.on('close', () => {
    console.log('closed')
    res.send()
  })

  process.stdout.pipe(res)
})

app.listen(3000)