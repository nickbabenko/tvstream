const SSDP = require('node-ssdp').Server

const { config } = require('./config')

const server = new SSDP({
  location: {
    port: process.env.HTTP_PORT || 3000,
    path: '/device.xml'
  },
  udn: `uuid:${config.DeviceID}`,
  allowWildcards: true,
  ssdpSig: 'TV Stream/3.0 UPnP/1.0',
})

exports.ssdp = () => {
  server.addUSN('upnp:rootdevice')
  server.addUSN('urn:schemas-upnp-org:device:MediaServer:1')
  server.addUSN('urn:schemas-upnp-org:service:ContentDirectory:1')
  server.addUSN('urn:schemas-upnp-org:service:ConnectionManager:1')
  server.start()
}
