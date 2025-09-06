#!/bin/bash
apiKey="b2e1d394bf3c59ccb73839832a02e9c1"
secret="6803403309"
curl -i \
-X GET \
-H 'Accept:application/json' \
-H "Api-key:$apiKey" \
-H "X-Signature:$(echo -n ${apiKey}${secret}$(date +%s)|sha256sum|awk '{ print $1}')" \
https://api.test.hotelbeds.com/hotel-api/1.0/status