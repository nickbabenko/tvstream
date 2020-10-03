#!/bin/bash

sudo apt-get install dvb-tools dtv-scan-tables node

dvbv5-scan /usr/share/dvb/dvb-t/uk-WinterHill -o scan_WinterHill.txt
