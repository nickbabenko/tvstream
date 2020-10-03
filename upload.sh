
#!/bin/bash

scp stream.js pi@192.168.0.71:stream.js
#scp -r node_modules pi@192.168.0.71:node_modules
scp stream.m3u8 pi@192.168.0.71:stream.m3u8
scp server.js pi@192.168.0.71:server.js
scp ConnectionManager.xml pi@192.168.0.71:ConnectionManager.xml
scp yarn.lock pi@192.168.0.71:yarn.lock
scp package.json pi@192.168.0.71:package.json