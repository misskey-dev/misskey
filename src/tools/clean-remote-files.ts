import * as promiseLimit from 'promise-limit';
import DriveFile, { IDriveFile } from '../models/drive-file';
import del from '../services/drive/delete-file';

const limit = promiseLimit(16);

DriveFile.find({
	'metadata._user.host': {
		$ne: null
	},
	'metadata.deletedAt': { $exists: false }
}, {
	fields: {
		_id: true
	}
}).then(async files => {
	console.log(`there is ${files.length} files`);

	await Promise.all(files.map(file => limit(() => job(file))));

	console.log('ALL DONE');
});

async function job(file: IDriveFile): Promise<any> {
	file = await DriveFile.findOne({ _id: file._id });

	await del(file, true);

	console.log('done', file._id);
}
