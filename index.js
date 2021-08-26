/*
import * as fs from 'fs';

if (fs.existsSync('./built')) {
	import('./built/index.js').then(built => built());
} else {
	console.log('Built code is not found. Probably an error occurred during a build or you just forgot to build.');
}
*/

const fs = require('fs');

if (fs.existsSync('./built')) {
	require('./built').default();
} else {
	console.log('Built code is not found. Probably an error occurred during a build or you just forgot to build.');
}
