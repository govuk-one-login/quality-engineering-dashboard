#/bin/bash

#
if [ -f .config/aws-accountid-config.json ]
then
  cat .config/aws-accountid-config.json
else
  cat src/data/config/examples/aws-accountid-config.json
fi
