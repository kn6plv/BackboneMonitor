#! /bin/sh
cd ../src
DEBUG=* nohup ./Main.js > LOG 2>&1 &
