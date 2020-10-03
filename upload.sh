
#!/bin/bash

#scp -r node_modules pi@192.168.0.71:node_modules
scp server.js pi@192.168.0.71:server.js
scp ssdp.js pi@192.168.0.71:ssdp.js
scp config.js pi@192.168.0.71:config.js
scp ConnectionManager.xml pi@192.168.0.71:ConnectionManager.xml
scp ContentDirectory.xml pi@192.168.0.71:ContentDirectory.xml
scp -r views pi@192.168.0.71:views
scp yarn.lock pi@192.168.0.71:yarn.lock
scp package.json pi@192.168.0.71:package.json