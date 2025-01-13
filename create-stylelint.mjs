#!/usr/bin/env node

const currentVersion = process.versions.node;
const requiredMajorVersion = parseInt(currentVersion.split('.')[0], 10);
const minimumMajorVersion = 18;

if (requiredMajorVersion < minimumMajorVersion) {
    console.error(`Node.js v${currentVersion} is out of date and unsupported!`);
    console.error(`Please use Node.js v${minimumMajorVersion} or higher.`);
    console.error('Download the latest version: https://nodejs.org/');
    process.exit(1);
}

import('./dist/index.js').then(({ main }) => main());
