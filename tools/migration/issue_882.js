// for Node.js interpret

const { default: DriveFile } = require('../../built/api/models/drive-file')

const migrate = async (doc) => {
	const result = await DriveFile.update(doc._id, {
		$set: {
			contentType: doc.metadata.type
		},
		$unset: {
			'metadata.type': ''
		}
	})
	return result.ok === 1
}

async function main() {
	let i = 0;

	const count = await DriveFile.count({});

	const iterate = async () => {
		if (i == count) return true;
		console.log(`${i} / ${count}`);
		const doc = (await DriveFile.find({}, { limit: 1, skip: i }))[0]
		const res = await migrate(doc);
		if (!res) {
			return false;
		} else {
			i++
			return await iterate();
		}
	}

	const res = await iterate();

	if (res) {
		return 'ok';
	} else {
		throw 'something happened';
	}
}

main().then(console.dir).catch(console.error)
