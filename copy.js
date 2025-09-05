'use strict';

const { writeFileSync, readFileSync } = require('node:fs');

writeFileSync('dist/package.json', readFileSync('package.json'));
writeFileSync('dist/public.pem', readFileSync('public.pem'));
