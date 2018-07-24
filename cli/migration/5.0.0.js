const { default: DriveFile } = require('../../built/models/drive-file');

DriveFile.update({}, {
	$rename: {
		'metadata.url': 'metadata.src',
		'metadata.isMetaOnly': 'metadata.withoutChunks',
	}
}, {
	multi: true
});
