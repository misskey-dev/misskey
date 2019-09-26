const fs = require('fs');

if (fs.existsSync('./built')) {
	require('./built').default();
} else {
	console.log('Built code is not found. Probably an error occurred during a build or you just forgot to build.');
}
