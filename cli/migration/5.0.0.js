const { default: DriveFile } = require('../../built/models/drive-file');

DriveFile.update({}, {
	$rename: {
		'metadata.isMetaOnly': 'metadata.withoutChunks'
	}
}, {
	multi: true
});
